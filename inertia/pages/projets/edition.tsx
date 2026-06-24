import { useState, useEffect } from 'react'
import { Head, useForm, usePage, router } from '@inertiajs/react'
import { toast } from 'react-toastify'
import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'

import Layout from '~/ui/layouts/layout'

import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'

import ProjetForm, { ProjetFormData, ProjetFormErrors } from '~/components/projets/form/projet-form'
import Toast from '~/ui/Toaster'
import { STEP_KEYS, STEPS } from '~/components/projets/form/steps_config'

export default function ProjetEditionPage({}: InferPageProps<ProjectsController, 'getForEdition'>) {
  const { url, props } = usePage<InferPageProps<ProjectsController, 'getForEdition'>>()
  const { projet } = props

  const urlParams = new URLSearchParams(url.split('?')[1] || '')
  const stepFromUrl = parseInt(urlParams.get('step') || '1', 10)

  const [stepsList, setStepsList] = useState<number[]>(() => {
    const stepIndexes: number[] = [STEP_KEYS.GENERAL_INFOS, STEP_KEYS.CONSOLIDATIONS]
    if (projet.parcelles.length > 0) stepIndexes.push(STEP_KEYS.PARCELLES)
    if (projet.exploitations.length > 0) stepIndexes.push(STEP_KEYS.EXPLOITATIONS)
    if (projet.captages.length > 0) stepIndexes.push(STEP_KEYS.CAPTAGES)

    return stepIndexes
  })

  const currentStep = (
    stepsList.includes(stepFromUrl) ? stepFromUrl : STEP_KEYS.GENERAL_INFOS
  ) as keyof typeof STEPS

  const initialFormData: ProjetFormData = {
    generalInfos: {
      projectName: projet.name,
      label: '',
      description: projet.description ?? '',
      type_action: projet.actionType ?? '',
      statut: projet.status,
    },
    // We never send new steps in the project edit form, and it won't be sent to the back-end
    // But the rest of the form is simpler by assuming there's something here at all times
    steps: [],
    parcelles: {
      millesime: projet.parcelles.length > 0 ? String(projet.parcelles[0].year) : '2024',
      items: projet.parcelles.map((p) => ({
        id: p.id,
        year: p.year,
        rpgId: p.rpgId,
        surface:
          p.surface !== null && p.surface !== undefined ? parseFloat(String(p.surface)) : null,
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
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
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
