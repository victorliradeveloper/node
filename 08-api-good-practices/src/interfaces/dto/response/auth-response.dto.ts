export class AuthResponseDto {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
