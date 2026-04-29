import { Email } from './email.vo';

export class User {
  private id: number;
  private name: string;
  private email: Email;
  private age: number;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    name: string,
    email: Email,
    age: number,
    id?: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.validate(name, age);
    this.name = name;
    this.email = email;
    this.age = age;
    this.id = id;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  private validate(name: string, age: number): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    if (age < 0 || age > 150) {
      throw new Error('Idade deve estar entre 0 e 150');
    }
  }

  getId(): number {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): Email {
    return this.email;
  }

  getAge(): number {
    return this.age;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Nome é obrigatório');
    }
    this.name = name;
    this.updatedAt = new Date();
  }

  updateEmail(email: Email): void {
    this.email = email;
    this.updatedAt = new Date();
  }

  updateAge(age: number): void {
    if (age < 0 || age > 150) {
      throw new Error('Idade deve estar entre 0 e 150');
    }
    this.age = age;
    this.updatedAt = new Date();
  }

  update(name?: string, email?: Email, age?: number): void {
    if (name !== undefined) {
      this.updateName(name);
    }
    if (email !== undefined) {
      this.updateEmail(email);
    }
    if (age !== undefined) {
      this.updateAge(age);
    }
  }
}

