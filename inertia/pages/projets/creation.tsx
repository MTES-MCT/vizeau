import { useState, useEffect } from 'react'
import { Head, useForm, usePage, router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'

import Layout from '~/ui/layouts/layout'

import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'

import ProjetForm, {
  ProjetFormData,
  ProjetFormErrors,
  defaultFormData,
} from '~/components/projets/form/projet-form'
import { STEP_KEYS, STEPS } from '~/components/projets/form/steps_config'

export default function ProjetCreationPage({}: InferPageProps<ProjectsController, 'create'>) {
  const [stepsList, setStepsList] = useState<number[]>([
    STEP_KEYS.GENERAL_INFOS,
    STEP_KEYS.FIRST_ENTRY,
    STEP_KEYS.CONSOLIDATIONS,
  ])

  const { url, props } = usePage<InferPageProps<ProjectsController, 'create'>>()
  const urlParams = new URLSearchParams(url.split('?')[1] || '')
  const stepFromUrl = parseInt(urlParams.get('step') || '1', 10)
  const currentStep = (
    stepsList.includes(stepFromUrl) ? stepFromUrl : STEP_KEYS.GENERAL_INFOS
  ) as keyof typeof STEPS

  const { data, setData, errors, setError, post, transform } =
    useForm<ProjetFormData>(defaultFormData)

  transform((formData) => {
    const step = formData.steps[0]
    const hasStepContent =
      step && (step.title.trim() || step.notes.trim() || step.documents.length > 0)

    const firstStepArray = hasStepContent
      ? [
          {
            ...step,
            date: step.date || new Date().toISOString().slice(0, 10),
            documents: step.documents ?? [],
          },
        ]
      : []

    return {
      name: formData.generalInfos.projectName,
      description: formData.generalInfos.description || null,
      actionType: formData.generalInfos.type_action || null,
      status: formData.generalInfos.statut,
      parcelles: formData.parcelles.items.map((p) => ({
        year: p.year,
        rpgId: p.rpgId,
        surface: p.surface,
        cultureCode: p.cultureCode,
        centroid: p.centroid ?? null,
      })),
      millesime: formData.parcelles.millesime,
      exploitationIds: formData.exploitations || [],
      captageIds: formData.captages.flatMap((code) => {
        const found = props.installations?.find((c) => c.code === code)
        return found ? [found.id] : []
      }),
      steps: firstStepArray,
    }
  })

  useEffect(() => {
    if (stepFromUrl > 1) {
      router.visit('/projets/creation?step=1', { replace: true })
    }
  }, [])

  const visitStep = (step: number) =>
    router.visit(`/projets/creation?step=${step}`, { preserveState: true })

  const handleSubmit = () => {
    post('/projets', {
      onError: (errors) => {
        setError(errors as any)
      },
    })
  }

  return (
    <Layout>
      <Head title="Créer un projet" />
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Nouveau projet"
            homeLinkProps={{ href: '/' }}
            segments={[{ label: 'Liste des projets', linkProps: { href: '/projets' } }]}
          />
        </div>
      </div>

      <div className="fr-container fr-my-4w">
        <ProjetForm
          handleStepsList={setStepsList}
          setCurrentStep={visitStep}
          currentStep={currentStep}
          stepsList={stepsList}
          data={data}
          setData={setData}
          errors={errors as ProjetFormErrors}
          setErrors={setError}
          onSubmit={handleSubmit}
        />
      </div>
    </Layout>
  )
}
