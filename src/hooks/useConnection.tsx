"use client"

import { useCloud } from "@/cloud/useCloud";
import React, { createContext, useState } from "react";
import { useCallback } from "react";
import { useConfig } from "./useConfig";
import { useSearchParams } from "next/navigation";

export type ConnectionMode = "cloud" | "manual" | "env"

type TokenGeneratorData = {
  shouldConnect: boolean;
  wsUrl: string;
  token: string;
  mode: ConnectionMode;
  disconnect: () => Promise<void>;
  connect: (mode: ConnectionMode) => Promise<void>;
};

const ConnectionContext = createContext<TokenGeneratorData | undefined>(undefined);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { generateToken, wsUrl: cloudWSUrl } = useCloud();
  const { config } = useConfig();
  const params = useSearchParams();
  const [connectionDetails, setConnectionDetails] = useState<{
    wsUrl: string;
    token: string;
    mode: ConnectionMode;
    shouldConnect: boolean;
  }>({ wsUrl: "", token: "", shouldConnect: false, mode: "manual" });

  const connect = useCallback(async (mode: ConnectionMode) => {
    let token = "";
    let url = "";
    /**
     * If the mode is cloud, generate a token and use the cloudWSUrl
     * USE the env variable if the mode is env
     * 
     */
    if (mode === "cloud") {
      token = await generateToken();
      url = cloudWSUrl;
    } else if (mode === "env") {
      if(!process.env.NEXT_PUBLIC_LIVEKIT_URL) {
        throw new Error("NEXT_PUBLIC_LIVEKIT_URL is not set");
      }
      url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      const {accessToken} = await fetch(`/api/token?control_room=${params.get("control_room")}&serial_number=${params.get("serial_number")}`).then((res) => res.json());
      token = accessToken;
    } else {
      token = config.settings.token;
      url = config.settings.ws_url;
    }
    setConnectionDetails({ wsUrl: url, token, shouldConnect: true, mode });
  }, [
    cloudWSUrl,
    config.settings.token,
    config.settings.ws_url,
    generateToken,
  ]);

  const disconnect = useCallback(async () => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }));
  }, []);

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        mode: connectionDetails.mode,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = React.useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}