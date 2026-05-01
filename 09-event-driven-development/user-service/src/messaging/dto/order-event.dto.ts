export interface OrderEventPayload {
  orderId: string;
  userId: string;
  name: string;
  email: string;
  description: string;
  amount: number;
}

export interface OrderEventDto {
  eventType: 'ORDER_CREATED';
  timestamp: string;
  payload: OrderEventPayload;
}
