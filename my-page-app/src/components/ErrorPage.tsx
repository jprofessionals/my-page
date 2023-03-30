type Props = {
  errorText: string
}

const ErrorPage = ({ errorText }: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        height: '500px',
      }}
    >
      <p style={{ fontSize: 70 }}>😭</p>
      <p>{errorText}</p>
    </div>
  )
}

export default ErrorPage
