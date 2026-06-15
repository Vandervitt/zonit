"use client";
// app/editor-next/page.tsx
// 薄路由入口：挂载基于新 schema 的隔离编辑器（landing-editor/）。
import { Editor } from "@/landing-editor/Editor";

export default function EditorNextPage() {
  return <Editor />;
}
