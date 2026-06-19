type AuthAlertProps = {
  message: string
}

export function AuthAlert({ message }: AuthAlertProps) {
  return <p className="auth-alert" role="alert">{message}</p>
}
