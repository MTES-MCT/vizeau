import { useState, useEffect } from 'react'
import { Head, useForm, usePage, router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'

import Layout from '~/ui/layouts/layout'

import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'

import { Stepper } from '@codegouvfr/react-dsfr/Stepper'

import ProjetForm, { ProjetFormData, ProjetFormErrors } from '~/components/projets/form/projet-form'
import Toast from '~/ui/Toaster'
import {
  ParcellesStep,
  ExploitationsStep,
  CaptagesStep,
  GeneralInfosStep,
  ConsolidationsStep,
} from '~/components/projets/form'

// Use the same step keys as creation (4, 5, 6 for optional steps) so ConsolidationsStep works unchanged.
// Step 2 (FirstEntry) is skipped for edition.
const STEPS: Record<
  number,
  { title: string; nextTitle?: string; component?: React.ComponentType<any> }
> = {
  1: {
    title: 'Informations générales',
    nextTitle: 'Rattachements',
    component: GeneralInfosStep,
  },
  3: { title: 'Rattachements', nextTitle: 'Parcelles', component: ConsolidationsStep },
  4: { title: 'Parcelles', nextTitle: 'Exploitations', component: ParcellesStep },
  5: { title: 'Exploitations', nextTitle: 'Points de prélèvements', component: ExploitationsStep },
  6: { title: 'Points de prélèvements', component: CaptagesStep },
}

export default function ProjetEditionPage({}: InferPageProps<ProjectsController, 'getForEdition'>) {
  const { url, props } = usePage<InferPageProps<ProjectsController, 'getForEdition'>>()
  const { projet } = props

  const urlParams = new URLSearchParams(url.split('?')[1] || '')
  const stepFromUrl = parseInt(urlParams.get('step') || '1', 10)

  const initialOptionalSteps: number[] = []
  if (projet.parcelles.length > 0) initialOptionalSteps.push(4)
  if (projet.exploitations.length > 0) initialOptionalSteps.push(5)
  if (projet.captages.length > 0) initialOptionalSteps.push(6)

  const [stepsList, setStepsList] = useState<number[]>([1, 3, ...initialOptionalSteps])

  const currentStep = (stepsList.includes(stepFromUrl) ? stepFromUrl : 1) as keyof typeof STEPS

  const initialFormData: ProjetFormData = {
    generalInfos: {
      projectName: projet.name,
      label: '',
      description: projet.description ?? '',
      type_action: projet.actionType ?? '',
      statut: projet.status,
    },
    firstEntry: {
      title: '',
      notes: '',
      tags: [],
      date: '',
      documents: [],
    },
    parcelles: {
      millesime: projet.parcelles.length > 0 ? String(projet.parcelles[0].year) : '2024',
      items: projet.parcelles.map((p) => ({
        id: p.id,
        rpgId: p.rpgId,
        surface: p.surface ? parseFloat(String(p.surface)) : null,
        cultureCode: p.cultureCode,
        centroid: p.centroid ?? undefined,
        exploitationName: null,
      })),
    },
    exploitations: projet.exploitations.map((e) => e.id),
    captages: projet.captages.map((c) => c.code),
  }

  const { data, setData, errors, setError, patch, transform } =
    useForm<ProjetFormData>(initialFormData)

  transform((formData) => {
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
        if (found) return [found.id]
        // Fallback pour les captages hors de la page de pagination actuelle
        const existing = projet.captages.find((c) => c.code === code)
        return existing ? [existing.id] : []
      }),
    }
  })

  useEffect(() => {
    if (stepFromUrl > 1) {
      router.visit(`/projets/edition/${projet.id}?step=1`, { replace: true })
    }
  }, [])

  const visitStep = (step: number) =>
    router.visit(`/projets/edition/${projet.id}?step=${step}`, { preserveState: true })

  const currentStepIndex = stepsList.indexOf(currentStep) + 1
  const nextStepKey = stepsList[stepsList.indexOf(currentStep) + 1]
  const nextTitle = nextStepKey ? STEPS[nextStepKey].title : undefined

  const handleSubmit = () => {
    patch(`/projets/${projet.id}`, {
      onSuccess: () => {
        toast(
          <Toast
            alerts={[{ severity: 'success', message: 'Le projet a été modifié avec succès.' }]}
          />,
          {
            closeButton: false,
            style: { padding: 0, background: 'transparent', boxShadow: 'none' },
          }
        )
        router.visit(`/projets/${projet.id}`)
      },
      onError: (errs) => {
        setError(errs as any)
      },
    })
  }

  return (
    <Layout>
      <Head title={`Modifier ${projet.name}`} />
      <div
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Modifier le projet"
            homeLinkProps={{ href: '/' }}
            segments={[
              { label: 'Liste des projets', linkProps: { href: '/projets' } },
              { label: projet.name, linkProps: { href: `/projets/${projet.id}` } },
            ]}
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
