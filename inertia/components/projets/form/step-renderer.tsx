export type StepRendererProps = {
  component?: React.ComponentType<any>
  handleStepsList: React.Dispatch<React.SetStateAction<number[]>>
  stepsList: number[]
  data: any
  setData: any
  errors: any
}

export default function StepRenderer({
  component: StepComponent,
  handleStepsList,
  stepsList,
  data,
  setData,
  errors,
}: StepRendererProps) {
  if (!StepComponent) return null

  return (
    <StepComponent
      stepsList={stepsList}
      setStepsList={handleStepsList}
      data={data}
      setData={setData}
      errors={errors}
    />
  )
}
