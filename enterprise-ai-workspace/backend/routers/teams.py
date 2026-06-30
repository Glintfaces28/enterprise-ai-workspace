from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Team, TeamMember, User
from schemas import TeamCreate, TeamDetailOut, TeamMemberAdd, TeamMemberOut, TeamOut

router = APIRouter(prefix="/api/teams", tags=["teams"])


def get_team_or_404(team_id: int, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


def get_membership(team_id: int, user_id: int, db: Session) -> TeamMember | None:
    return (
        db.query(TeamMember)
        .filter(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        .first()
    )


def require_member(team_id: int, current_user: User, db: Session) -> TeamMember:
    membership = get_membership(team_id, current_user.id, db)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")
    return membership


def require_owner(team: Team, current_user: User):
    if team.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can do this")


def require_admin_or_owner(team: Team, current_user: User, db: Session):
    membership = get_membership(team.id, current_user.id, db)
    if not membership or membership.role not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Only team owners and admins can do this")


def serialize_member(member: TeamMember, user: User) -> TeamMemberOut:
    return TeamMemberOut(
        id=member.id,
        user_id=member.user_id,
        username=user.username,
        email=user.email,
        role=member.role,
        joined_at=member.joined_at,
    )


def serialize_team(team: Team, current_user: User, db: Session) -> TeamOut:
    membership = get_membership(team.id, current_user.id, db)
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    return TeamOut(
        id=team.id,
        name=team.name,
        description=team.description,
        created_by=team.created_by,
        created_at=team.created_at,
        member_count=member_count,
        my_role=membership.role if membership else None,
        is_owner=team.created_by == current_user.id,
    )


@router.post("", response_model=TeamOut, status_code=201)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Team).filter(Team.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already taken")

    team = Team(
        name=data.name.strip(),
        description=data.description.strip() if data.description else None,
        created_by=current_user.id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    owner = TeamMember(team_id=team.id, user_id=current_user.id, role="owner")
    db.add(owner)
    db.commit()

    return serialize_team(team, current_user, db)


@router.get("", response_model=list[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [membership.team_id for membership in memberships]
    if not team_ids:
        return []

    teams = db.query(Team).filter(Team.id.in_(team_ids)).order_by(Team.created_at.desc()).all()
    return [serialize_team(team, current_user, db) for team in teams]


@router.get("/{team_id}", response_model=TeamDetailOut)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = get_team_or_404(team_id, db)
    require_member(team_id, current_user, db)

    rows = (
        db.query(TeamMember, User)
        .join(User, User.id == TeamMember.user_id)
        .filter(TeamMember.team_id == team_id)
        .order_by(TeamMember.joined_at.asc())
        .all()
    )
    team_out = serialize_team(team, current_user, db)
    return TeamDetailOut(
        **team_out.model_dump(),
        members=[serialize_member(member, user) for member, user in rows],
    )


@router.post("/{team_id}/members", response_model=TeamMemberOut, status_code=201)
def add_member(
    team_id: int,
    data: TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = get_team_or_404(team_id, db)
    require_admin_or_owner(team, current_user, db)

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    already_member = get_membership(team_id, user.id, db)
    if already_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = TeamMember(team_id=team_id, user_id=user.id, role=data.role)
    db.add(member)
    db.commit()
    db.refresh(member)

    return serialize_member(member, user)


@router.delete("/{team_id}/members/{user_id}", status_code=204)
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = get_team_or_404(team_id, db)
    require_owner(team, current_user)

    if user_id == team.created_by:
        raise HTTPException(status_code=400, detail="Cannot remove the team owner")

    member = get_membership(team_id, user_id, db)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()


@router.delete("/{team_id}", status_code=204)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = get_team_or_404(team_id, db)
    require_owner(team, current_user)

    db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
    db.delete(team)
    db.commit()
