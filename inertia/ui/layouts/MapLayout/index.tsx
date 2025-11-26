import { useState, useRef, useLayoutEffect } from 'react'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'

export type MapLayoutProps = {
  pageName?: string
  headerAdditionalContent?: React.ReactNode
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  actionsList?: any[]
  map?: React.ReactNode
}

export default function MapLayout({
  pageName,
  headerAdditionalContent,
  leftContent,
  rightContent,
  map,
}: MapLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  // Ref et state pour la hauteur du header
  const mapHeaderRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState<number>(68) // 4.25rem = 68px

  useLayoutEffect(() => {
    if (mapHeaderRef.current) {
      const height = mapHeaderRef.current.offsetHeight
      setHeaderHeight(height)
    }
  }, [headerAdditionalContent, leftSidebarOpen, rightSidebarOpen])

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      {leftContent && (
        <div
          className={`transition-all duration-300 ease-in-out flex ${leftSidebarOpen ? 'w-170' : 'w-0'}`}
        >
          {leftSidebarOpen && (
            <div className="flex-1 overflow-auto">
              <div
                className="flex items-center fr-pl-2v"
                style={{
                  background: fr.colors.decisions.background.alt.blueFrance.default,
                  height: headerHeight,
                }}
              >
                <h6
                  className="fr-text--lg w-full font-medium fr-m-0 w-fit fr-pr-2v"
                  style={{
                    borderRight: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                  }}
                >
                  {pageName}
                </h6>
              </div>
              <div
                className="flex-1 overflow-auto"
                style={{ height: `calc(100% - ${headerHeight}px)` }}
              >
                {leftContent}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Center Content (Map) with Header */}
      <div className="w-full h-full">
        {/* Map Header */}
        <div
          ref={mapHeaderRef}
          className="w-full min-h-17 fr-p-2v flex items-center justify-between"
          style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
        >
          <div className="flex items-center">
            {!leftSidebarOpen && (
              <>
                <Button
                  iconId="fr-icon-arrow-right-s-line"
                  priority="tertiary no outline"
                  onClick={() => setLeftSidebarOpen(true)}
                  title="Ouvrir le panneau gauche"
                />
                <h6 className="fr-text--lg font-medium fr-m-0 w-fit">{pageName}</h6>
              </>
            )}

            {leftSidebarOpen && (
              <Button
                iconId="fr-icon-arrow-left-s-line"
                priority="tertiary no outline"
                onClick={() => setLeftSidebarOpen(false)}
                title="Fermer le panneau gauche"
              />
            )}
          </div>

          <div className="w-full flex items-center flex-1 fr-px-2v">{headerAdditionalContent}</div>

          {!rightSidebarOpen && (
            <Button
              iconId="fr-icon-tools-fill"
              onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
              priority="tertiary"
              size="small"
              title={rightSidebarOpen ? 'Fermer les paramètres' : 'Ouvrir les paramètres'}
            />
          )}
        </div>

        {/* Map Content */}
        <div
          className="relative shadow-lg z-10"
          style={{ height: `calc(100% - ${headerHeight}px)` }}
        >
          {map || (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 text-xl">Map Content</div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {rightContent && (
        <div
          className={`transition-all duration-300 ease-in-out flex flex-col ${rightSidebarOpen ? 'w-120' : 'w-0'}`}
        >
          {rightSidebarOpen && (
            <div className="flex flex-col h-full">
              <div
                className="flex items-center justify-between fr-pr-2v"
                style={{
                  background: fr.colors.decisions.background.alt.blueFrance.default,
                  height: headerHeight,
                }}
              >
                <h6
                  className="fr-text--lg font-medium fr-m-0 fr-pl-2v"
                  style={{
                    borderLeft: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                  }}
                >
                  Paramètres d'affichage
                </h6>
                <Button
                  iconId="fr-icon-close-line"
                  onClick={() => setRightSidebarOpen(false)}
                  priority="tertiary no outline"
                  title="Masquer les paramètres"
                  size="small"
                />
              </div>
              <div
                className="fr-p-1v overflow-auto"
                style={{ height: `calc(100% - ${headerHeight}px)` }}
              >
                {rightContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
