from typing import List, Optional

from sqlalchemy.orm import Session

from ..core.exceptions import NotFoundError, AuthorizationError
from ..models.application import Application
from ..models.user import User
from ..schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
)
from ..utils.helpers import update_model_fields


class ApplicationService:
    def __init__(self, db: Session):
        self.db = db

    def list_for_user(self, user_id: str) -> List[ApplicationResponse]:
        apps = (
            self.db.query(Application)
            .filter(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
            .all()
        )
        return [ApplicationResponse.model_validate(a) for a in apps]

    def get(self, app_id: str, user_id: str) -> ApplicationResponse:
        app = self.db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise NotFoundError("Application")
        if str(app.user_id) != str(user_id):
            raise AuthorizationError()
        return ApplicationResponse.model_validate(app)

    def create(self, user_id: str, payload: ApplicationCreate) -> ApplicationResponse:
        data = payload.model_dump(exclude_unset=True)
        app = Application(user_id=user_id, **data)
        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return ApplicationResponse.model_validate(app)

    def update(
        self, app_id: str, user_id: str, payload: ApplicationUpdate
    ) -> ApplicationResponse:
        app = self.db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise NotFoundError("Application")
        if str(app.user_id) != str(user_id):
            raise AuthorizationError()

        data = payload.model_dump(exclude_unset=True)
        update_model_fields(app, data)
        self.db.commit()
        self.db.refresh(app)
        return ApplicationResponse.model_validate(app)

    def delete(self, app_id: str, user_id: str) -> None:
        app = self.db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise NotFoundError("Application")
        if str(app.user_id) != str(user_id):
            raise AuthorizationError()
        self.db.delete(app)
        self.db.commit()
