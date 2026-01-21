export const typesActiviteAgricole = {
  cultures: {
    cereales: { label: 'Céréales', value: 'cereales' },
    oleoproteagineux: { label: 'Oléoprotéagineux', value: 'oleoproteagineux' },
    autre_grandes_cultures: { label: 'Autres grandes cultures', value: 'autre_grandes_cultures' },
    legumes: { label: 'Légumes', value: 'legumes' },
    champignons: { label: 'Champignons', value: 'champignons' },
    fleurs: { label: 'Fleurs', value: 'fleurs' },
    horticulture_diverses: { label: 'Horticulture diverses', value: 'horticulture_diverses' },
    viticulture: { label: 'Viticulture', value: 'viticulture' },
    fruits: { label: 'Fruits', value: 'fruits' },
    cultures_permanentes: { label: 'Cultures permanentes', value: 'cultures_permanentes' },
    polyculture: { label: 'Polyculture', value: 'polyculture' },
    non_classe: { label: 'Non classé', value: 'non_classe' },
    bio: { label: 'Bio', value: 'bio' },
    conservation: { label: 'Conservation', value: 'conservation' },
  },
  elevages: {
    bovins_lait: { label: 'Bovins lait', value: 'bovins_lait' },
    bovins_viande: { label: 'Bovins viande', value: 'bovins_viande' },
    bovins_mixte: { label: 'Bovins mixte', value: 'bovins_mixte' },
    ovins: { label: 'Ovins', value: 'ovins' },
    caprins: { label: 'Caprins', value: 'caprins' },
    porcins: { label: 'Porcins', value: 'porcins' },
    volailles: { label: 'Volailles', value: 'volailles' },
    autres_elevages: { label: 'Autres élevages', value: 'autres_elevages' },
    equides: { label: 'Equidés', value: 'equides' },
    autres_herbivores: { label: 'Autres herbivores', value: 'autres_herbivores' },
    combinaison_granivores: { label: 'Combinaison granivores', value: 'combinaison_granivores' },
    polyelevage: { label: 'Polyélevage', value: 'polyelevage' },
    bio: { label: 'Bio', value: 'bio' },
    non_classe: { label: 'Non classé', value: 'non_classe' },
  },
}

export const typesActiviteAgricoleGroupLabels: Record<string, string> = {
  cultures: 'Type de cultures',
  elevages: "Type d'élevages",
}
