"use client";

import { useReducer, useRef, useCallback } from "react";
import type { ChatMessage } from "@/lib/ai/types";

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
}

type ChatAction =
  | { type: "ADD_USER_MESSAGE"; payload: ChatMessage }
  | { type: "ADD_ASSISTANT_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_ASSISTANT_MESSAGE"; payload: { id: string; content: string } }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CLEAR" };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_USER_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "ADD_ASSISTANT_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "UPDATE_ASSISTANT_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id
            ? { ...m, content: action.payload.content }
            : m
        ),
      };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "CLEAR":
      return { messages: [], isLoading: false };
    default:
      return state;
  }
}

export function useChat(role: "user" | "admin" = "user") {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isLoading: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };
      dispatch({ type: "ADD_USER_MESSAGE", payload: userMessage });

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };
      dispatch({ type: "ADD_ASSISTANT_MESSAGE", payload: assistantMessage });
      dispatch({ type: "SET_LOADING", payload: true });

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const allMessages = [...state.messages, userMessage];
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages, role }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to send message");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          dispatch({
            type: "UPDATE_ASSISTANT_MESSAGE",
            payload: { id: assistantMessage.id, content: accumulated },
          });
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        const errorContent =
          error instanceof Error ? error.message : "Something went wrong";
        dispatch({
          type: "UPDATE_ASSISTANT_MESSAGE",
          payload: {
            id: assistantMessage.id,
            content: `Error: ${errorContent}`,
          },
        });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
        abortRef.current = null;
      }
    },
    [state.messages, role]
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    dispatch({ type: "CLEAR" });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    sendMessage,
    stopGenerating,
    clearChat,
  };
}
