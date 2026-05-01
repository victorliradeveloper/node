export type UserEventType = 'USER_REGISTERED' | 'USER_LOGIN' | 'USER_PASSWORD_RESET';

export interface UserEventPayload {
  userId: string;
  name: string;
  email: string;
}

export interface UserEventDto {
  eventType: UserEventType;
  timestamp: string;
  payload: UserEventPayload;
}
