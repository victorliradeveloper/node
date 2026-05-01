import { OrderEventPayload } from '../../messaging/dto/order-event.dto';
import { UserEventPayload } from '../../messaging/dto/user-event.dto';

type TemplateType = 'USER_REGISTERED' | 'USER_LOGIN' | 'ORDER_CREATED' | 'USER_PASSWORD_RESET';

export class EmailTemplateFactory {
  static build(type: TemplateType, payload: UserEventPayload | OrderEventPayload): string {
    switch (type) {
      case 'USER_REGISTERED':
        return EmailTemplateFactory.userRegistered(payload as UserEventPayload);
      case 'USER_LOGIN':
        return EmailTemplateFactory.userLogin(payload as UserEventPayload);
      case 'ORDER_CREATED':
        return EmailTemplateFactory.orderCreated(payload as OrderEventPayload);
      case 'USER_PASSWORD_RESET':
        return EmailTemplateFactory.passwordReset(payload as UserEventPayload);
    }
  }

  private static userRegistered(p: UserEventPayload): string {
    return `
      <h2>Bem-vindo ao sistema, ${p.name}!</h2>
      <p>Sua conta foi criada com sucesso.</p>
      <p>E-mail: <strong>${p.email}</strong></p>
    `;
  }

  private static userLogin(p: UserEventPayload): string {
    return `
      <h2>Novo acesso detectado</h2>
      <p>Olá, ${p.name}. Detectamos um novo acesso na sua conta.</p>
      <p>Se não foi você, redefina sua senha imediatamente.</p>
    `;
  }

  private static orderCreated(p: OrderEventPayload): string {
    const shortId = p.orderId.substring(0, 8);
    return `
      <h2>Pedido confirmado! #${shortId}</h2>
      <p>Olá, ${p.name}.</p>
      <p><strong>Descrição:</strong> ${p.description}</p>
      <p><strong>Valor:</strong> R$ ${p.amount.toFixed(2)}</p>
    `;
  }

  private static passwordReset(p: UserEventPayload): string {
    return `
      <h2>Redefinição de senha solicitada</h2>
      <p>Olá, ${p.name}.</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Se não foi você, ignore este e-mail.</p>
    `;
  }
}
