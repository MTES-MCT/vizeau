import { useState, useEffect } from 'react'
import { Head, useForm, usePage, router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'

import Layout from '~/ui/layouts/layout'

import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'

import { Stepper } from '@codegouvfr/react-dsfr/Stepper'

import ProjetForm, {
  ProjetFormData,
  ProjetFormErrors,
  defaultFormData,
} from '~/components/projets/form/projet-form'
import {
  ParcellesStep,
  ExploitationsStep,
  CaptagesStep,
  GeneralInfosStep,
  ConsolidationsStep,
  FirstEntryStep,
} from '~/components/projets/form'

const STEPS: Record<
  number,
  { title: string; nextTitle?: string; component?: React.ComponentType<any> }
> = {
  1: {
    title: 'Informations générales',
    nextTitle: 'Première étape de suivi',
    component: GeneralInfosStep,
  },
  2: { title: 'Première étape de suivi', nextTitle: 'Rattachements', component: FirstEntryStep },
  3: { title: 'Rattachements', nextTitle: 'Parcelles', component: ConsolidationsStep },
  4: { title: 'Parcelles', nextTitle: 'Exploitations', component: ParcellesStep },
  5: { title: 'Exploitations', nextTitle: 'Points de prélèvements', component: ExploitationsStep },
  6: { title: 'Points de prélèvements', component: CaptagesStep },
}

export default function ProjetCreationPage({}: InferPageProps<ProjectsController, 'create'>) {
  const [stepsList, setStepsList] = useState<number[]>([1, 2, 3])

  const { url, props } = usePage<InferPageProps<ProjectsController, 'create'>>()
  const urlParams = new URLSearchParams(url.split('?')[1] || '')
  const stepFromUrl = parseInt(urlParams.get('step') || '1', 10)
  const currentStep = (stepsList.includes(stepFromUrl) ? stepFromUrl : 1) as keyof typeof STEPS

  const { data, setData, errors, setError, post, transform } =
    useForm<ProjetFormData>(defaultFormData)

  transform((formData) => {
    const firstEntry =
      formData.firstEntry.title.trim() || formData.firstEntry.notes.trim()
        ? {
            ...formData.firstEntry,
            date: formData.firstEntry.date || new Date().toISOString().slice(0, 10),
          }
        : null

    return {
      name: formData.generalInfos.projectName,
      description: formData.generalInfos.description || null,
      actionType: formData.generalInfos.type_action || null,
      status: formData.generalInfos.statut,
      parcelles: formData.parcelles.items.map((p) => ({
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
      firstEntry,
    }
  })

  useEffect(() => {
    if (stepFromUrl > 1) {
      router.visit('/projets/creation?step=1', { replace: true })
    }
  }, [])

  const visitStep = (step: number) =>
    router.visit(`/projets/creation?step=${step}`, { preserveState: true })

  const currentStepIndex = stepsList.indexOf(currentStep) + 1
  const nextStepKey = stepsList[stepsList.indexOf(currentStep) + 1]
  const nextTitle = nextStepKey ? STEPS[nextStepKey].title : undefined

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
      <div
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
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
        <div className="min-h-[120px] fr-mb-4w">
          <Stepper
            currentStep={currentStepIndex}
            nextTitle={nextTitle}
            stepCount={stepsList.length}
            title={STEPS[currentStep].title}
          />
        </div>

        <ProjetForm
          handleStepsList={setStepsList}
          setCurrentStep={visitStep}
          currentStep={currentStep}
          stepsList={stepsList}
          steps={STEPS}
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
