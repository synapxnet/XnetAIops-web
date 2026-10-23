/* Copyright (C) 2026 Synapxnet. All rights reserved.
 * This file is Synapxnet Proprietary and Confidential. It is strictly
 * forbidden to copy, distribute, or use without explicit authorization.
 * 浮窗助手服务边界 / Floating assistant service boundary.
 * Author: maoyo | Department: 研发部 | Date: 2026-10-23 | Version: 1.3.0
 * Security Level: INTERNAL | Maintainer: maoyo | Email: synapxnet@gmail.com
 */
export interface Assistant {
  id: number;
  name: string;
  avatar?: string;
  gatewayUrl?: string;
  welcomeMessage?: string;
  placeholder?: string;
  uiConfig?: string | {
    primaryColor?: string;
    size?: { width?: number; height?: number };
    position?: { right: number; bottom: number };
  };
}
export interface AssistantConversation { id: number; uid: string }
export interface AssistantMessage {
  id: number;
  uid: string;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}
/** 身份、工作空间、鉴权与持久化由宿主适配器负责。 The host adapter owns identity, scope, authorization and persistence. */
export interface AssistantAdapter {
  fetchAssistant: (assistantId?: number) => Promise<Assistant | null>;
  createConversation: (assistantId: number) => Promise<AssistantConversation>;
  addMessage: (conversationId: number, role: AssistantMessage['role'], content: string) => Promise<unknown>;
  streamReply: (request: {
    assistantId: number;
    conversationId: number;
    messages: Pick<AssistantMessage, 'role' | 'content'>[];
    signal: AbortSignal;
  }) => Promise<Response>;
}
