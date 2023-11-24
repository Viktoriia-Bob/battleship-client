import {
  MessageSocketEnum,
} from '../constants/message-socket-enum';

export interface Message {
  content: unknown,
  id: string;
  type: MessageSocketEnum;
}
