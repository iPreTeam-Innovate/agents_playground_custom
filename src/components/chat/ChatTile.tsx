import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatMessageInput } from "@/components/chat/ChatMessageInput";
import { ChatMessage as ComponentsChatMessage } from "@livekit/components-react";
import { useEffect, useRef } from "react";

const inputHeight = 48;

let partialResponse = '';
let partialSource = '';
let isSource = false;

export type ChatMessageType = {
  name: string;
  message: string;
  isSelf: boolean;
  timestamp: number;
};

type ChatTileProps = {
  messages: ChatMessageType[];
  accentColor: string;
  onSend?: (message: string) => Promise<ComponentsChatMessage>;
};

export const ChatTile = ({ messages, accentColor, onSend }: ChatTileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [containerRef, messages]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{
          height: `calc(100% - 6rem)`,
        }}
      >
        <div className="flex flex-col min-h-full justify-end">
          {messages.map((message, index, allMsg) => {
              console.log(messages);
              let outputMessage = "";
              let source = "";
              const hideName = index >= 1 && allMsg[index - 1].name === message.name;

              // <response> タグを含む場合
              if (message.message.includes("<response>")) {
                  // <response> が閉じられていない場合
                  if (!message.message.includes("</response>")) {
                      const responseMatch = message.message.match(/<response>([\s\S]*)/);
                      if (responseMatch) {
                          partialResponse += responseMatch[1];  // 閉じタグが来るまで蓄積
                      }
                  } else {
                      // 閉じタグがある場合、蓄積していたものも含めて出力
                      let responseMatch = message.message.match(/<response>([\s\S]*?)<\/response>/);
                      if (responseMatch == null) {
                          responseMatch = message.message.match(/([\s\S]*?)<\/response>/);
                        }
                      partialResponse += responseMatch ? responseMatch[1] : '';
                      outputMessage += partialResponse;
                      partialResponse = '';  // 完了後はリセット
                  }
              }else if (message.message.includes("</response>")) {
                  outputMessage = partialResponse;
                  const sourceMatch = message.message.match(/([\s\S]*?)<\/response>/);
                  if (sourceMatch) {
                      outputMessage += sourceMatch[1];  // 閉じタグが来るまで蓄積
                  }
                  partialResponse = '';
              }

              // <source> タグを含む場合
              if (message.message.includes("<source>")) {
                  isSource = true;
                  // <source> が閉じられていない場合
                  if (!message.message.includes("</source>")) {
                      const sourceMatch = message.message.match(/<source>([\s\S]*)/);
                      if (sourceMatch) {
                          partialSource += sourceMatch[1];  // 閉じタグが来るまで蓄積
                      }
                  } else {
                      // 閉じタグがある場合、蓄積していたものも含めて出力
                      let sourceMatch = message.message.match(/<source>([\s\S]*?)<\/source>/);
                      if (sourceMatch == null) {
                          sourceMatch = message.message.match(/([\s\S]*?)<\/source>/);
                      }
                      partialSource += sourceMatch ? sourceMatch[1] : '';
                      source += partialSource;
                      partialSource = '';  // 完了後はリセット
                  }
              }else if (message.message.includes("</source>")) {
                  source = partialSource;
                  let sourceMatch = message.message.match(/([\s\S]*?)<\/source>/);
                  if (sourceMatch) {
                      sourceMatch = message.message.match(/([\s\S]*?)<\/source>/);
                  }
                  source += sourceMatch ? sourceMatch[1] : '';
                  partialSource = '';
                  isSource = false;
              }

              if (!message.message.includes("<response>") && !message.message.includes("<source>") &&
                  !message.message.includes("</response>") && !message.message.includes("</source>") &&
                  !isSource) {
                  outputMessage = message.message;
              } else if (!message.message.includes("<response>") && !message.message.includes("<source>") &&
                  !message.message.includes("</response>") && !message.message.includes("</source>") &&
                  isSource) {
                  source = message.message;
              }
            return (
              <ChatMessage
                key={index}
                hideName={hideName}
                name={message.name}
                message={outputMessage}
                citation={source}
                isSelf={message.isSelf}
                accentColor={accentColor}
              />
            );
          })}
        </div>
      </div>
      <ChatMessageInput
        height={inputHeight}
        placeholder="Type a message"
        accentColor={accentColor}
        onSend={onSend}
      />
    </div>
  );
};
