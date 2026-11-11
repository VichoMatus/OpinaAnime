"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon } from "@/components/icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ id, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-field">
      <input {...props} id={inputId} type={visible ? "text" : "password"} className="field" />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-controls={inputId}
        onClick={() => setVisible((current) => !current)}
      >
        <EyeIcon crossed={visible} />
      </button>
    </span>
  );
}
