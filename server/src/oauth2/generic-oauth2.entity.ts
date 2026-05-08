import { Column, Entity, ManyToOne } from "typeorm";
import { CustomJoinColumn } from "../custom-columns/custom-join-column";
import User from "../users/user.entity";
import AbstractOAuth2 from "./abstract-oauth2.entity";

@Entity("GenericOAuth2")
export default class GenericOAuth2 extends AbstractOAuth2 {
  @ManyToOne(() => User, (user) => user.GenericOAuth2, { onDelete: "CASCADE" })
  @CustomJoinColumn({ name: "UserID" })
  User: User;

  @Column({ default: false })
  LinkedCalendar: boolean;
}
