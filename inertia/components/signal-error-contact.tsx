import Alert from '@codegouvfr/react-dsfr/Alert'

export default function SignalErrorContact() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL

  if (!supportEmail) {
    console.warn('Support e-mail address configuration is missing')
    return null
  }

  return (
    <Alert
      severity="info"
      small
      description={
        <div className="flex flex-col gap-2">
          <p>Une erreur ou une incohérence dans les données ? N’hésitez pas à le signaler.</p>
          <a href={`mailto:${supportEmail}`} className="w-fit">
            Contacter un administrateur
          </a>
        </div>
      }
    />
  )
}
