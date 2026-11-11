"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon } from "@/components/icons";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ id, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <span className="password-field relative block">
      <input {...props} id={inputId} type={visible ? "text" : "password"} className="field" />
      <button
        type="button"
        className="password-toggle absolute inset-y-0 right-0 z-10 px-3 focus-visible:outline focus-visible:outline-2"
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        aria-controls={inputId}
        onClick={() => setVisible((current) => !current)}
      >
        <EyeIcon crossed={visible} />
      </button>
    </span>
  );
}
