import { fr } from '@codegouvfr/react-dsfr'
import Button from "@codegouvfr/react-dsfr/Button"


import './empty-placeholder.css'

type IllustrationProps = {
  pictogram?: React.ElementType;
  illustrativeIcon?: string;
};

const Illustration = ({ pictogram, illustrativeIcon }: IllustrationProps) => {
  if (pictogram) {
    const PictogramComponent = pictogram;
    return <PictogramComponent height={110} width={110} />;
  }
  if (illustrativeIcon) {
    return <span className={`${illustrativeIcon} custom-size`} aria-hidden="true"></span>;
  }
  return null;
};

export type EmptyPlaceholderProps = {
  label: string;
  illustrativeIcon?: string;
  pictogram?: React.ElementType;
  hint?: string;
  buttonLabel?: string;
  actionAriaLabel?: string;
  buttonIcon?: string;
  handleClick?: () => void;
}
export default function EmptyPlaceholder({ label, pictogram, illustrativeIcon, hint, buttonLabel, actionAriaLabel, buttonIcon, handleClick }: EmptyPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center fr-p-4v"
      style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
    >
      <div>
        <div className="flex flex-col items-center">
          <Illustration pictogram={pictogram} illustrativeIcon={illustrativeIcon} />
          {label && <span className='fr-mt-2v' style={{ fontWeight: 300 }}>{label}</span>}
        </div>

        {hint && <p className='fr-text--sm text-center fr-mt-2v'>{hint}</p>}
      </div>

      {buttonLabel && (
        <Button
          size='small'
          iconId={buttonIcon as any}
          onClick={handleClick}
          aria-label={actionAriaLabel || buttonLabel}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
