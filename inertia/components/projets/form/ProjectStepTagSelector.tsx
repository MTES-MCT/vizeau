import { debounce } from 'lodash-es'
import InputWithSelector, { OptionType } from '~/ui/InputWithSelector'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { router, usePage } from '@inertiajs/react'
import type { ProjectStepTagJson } from '#types/models'
import { Tag } from '@codegouvfr/react-dsfr/Tag'

const debouncedFetchTags = debounce((newInput?: string) => {
  router.reload({
    only: ['filteredProjectStepTags'],
    data: { tagSearch: newInput },
    replace: true,
  })
}, 300)

type ProjectStepTagSelectorProps = {
  inputValue: string
  setInputValue: (value: string) => void
  values: number[]
  onChange: (values: number[]) => void
}

type ProjectStepTagPageProps = {
  filteredProjectStepTags: ProjectStepTagJson[]
  lastCreatedProjectStepTag?: ProjectStepTagJson[]
  createTagUrl: string
  deleteTagUrl: string
}

// Every tag fetched is cached for later retrieval
const tagsCache: Record<number, ProjectStepTagJson> = {}

export function ProjectStepTagSelector({
  inputValue,
  setInputValue,
  values,
  onChange,
}: ProjectStepTagSelectorProps) {
  const { filteredProjectStepTags, createTagUrl, deleteTagUrl } = usePage()
    .props as unknown as ProjectStepTagPageProps

  // Cache the currently filtered tags
  for (const tag of filteredProjectStepTags ?? []) {
    tagsCache[tag.id] = tag
  }

  const options: OptionType<number>[] = (filteredProjectStepTags ?? []).map((t) => ({
    value: t.id,
    label: t.name,
    isSelected: values.includes(t.id),
    actions: [
      {
        value: t.id,
        label: "Supprimer l'étiquette",
        iconId: 'fr-icon-delete-bin-line',
        isCritical: true,
        onClick: (value: number) => {
          router.delete(deleteTagUrl, {
            data: { tagId: value },
            only: ['filteredProjectStepTags'],
            replace: true,
            onSuccess: () => {
              delete tagsCache[value]
              if (values.includes(value)) {
                onChange(values.filter((v) => v !== value))
              }
            },
          })
        },
      },
    ],
  }))

  const selectedTags: Array<ProjectStepTagJson | undefined> = values.map((id) => tagsCache[id])

  const normalizedInput = inputValue ? inputValue.trim().toLowerCase() : ''

  const tagAlreadyExists =
    normalizedInput.length > 0
      ? Object.values(tagsCache).some((tag) => tag.name.trim().toLowerCase() === normalizedInput)
      : false

  return (
    <div className="flex flex-col gap-2">
      <InputWithSelector<number>
        inputValue={inputValue}
        options={options}
        icon="fr-icon-search-line"
        hint="Les étiquettes vous permettent de trier vos étapes plus efficacement."
        handleInputChange={(newInput) => {
          setInputValue(newInput)
          debouncedFetchTags(newInput)
        }}
        onOptionChange={(updatedOption) => {
          if (updatedOption.isSelected) {
            onChange([...values, updatedOption.value])
          } else {
            onChange(values.filter((v) => v !== updatedOption.value))
          }
        }}
        label="Rechercher ou créer une étiquette"
        emptyMenuPlaceholder={
          Object.keys(tagsCache).length === 0 && options.length === 0
            ? "Aucune étiquette n'a encore été créée. Commencez à écrire pour en créer une."
            : "Cette étiquette n'existe pas encore. Vous pouvez la créer en cliquant sur le bouton de création."
        }
        additionalActions={
          normalizedInput &&
          !tagAlreadyExists && (
            <Button
              priority="tertiary no outline"
              iconId="fr-icon-add-line"
              type="button"
              style={{ width: '100%' }}
              onClick={() => {
                router.post(
                  createTagUrl,
                  { name: normalizedInput },
                  {
                    only: ['filteredProjectStepTags', 'lastCreatedProjectStepTag'],
                    preserveState: true,
                    preserveUrl: true,
                    onSuccess: (page) => {
                      const props = page.props as unknown as ProjectStepTagPageProps
                      setInputValue('')
                      if (props.lastCreatedProjectStepTag?.[0]) {
                        onChange([...values, props.lastCreatedProjectStepTag[0].id])
                      }
                    },
                  }
                )
              }}
            >
              Créer et ajouter l'étiquette
            </Button>
          )
        }
      />
      <div className="flex flex-wrap gap-2">
        {selectedTags.length === 0 ? (
          <p className="fr-m-0">
            <i>Aucune étiquette sélectionnée.</i>
          </p>
        ) : (
          selectedTags.map((tag, i) => {
            if (!tag) {
              return (
                <Tag key={`missing-${i}`} nativeButtonProps={{ 'aria-label': 'Chargement...' }}>
                  ...
                </Tag>
              )
            }
            return (
              <Tag
                key={tag.id}
                nativeButtonProps={{
                  onClick: () => {
                    onChange(values.filter((v) => v !== tag.id))
                  },
                }}
                dismissible={true}
              >
                {tag.name}
              </Tag>
            )
          })
        )}
      </div>
    </div>
  )
}
