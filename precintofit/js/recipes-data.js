/**
 * PrecintoFit - Base de datos de Recetas, Módulos y Porciones
 * Adaptado a ingredientes reales argentinos y dinámica familiar (Adulto + Chicos de 13 y 4 años)
 */

// Categorías del sistema
const CATEGORIES = [
  { id: "todas", label: "Todas", icon: "✨" },
  { id: "modulos", label: "1. Bases (1 hora el finde)", icon: "📦" },
  { id: "ensambles", label: "2. Platos de 10 min", icon: "⚡" },
  { id: "galletitas", label: "3. Galletitas para Chicos", icon: "🍪" },
  { id: "carnes", label: "Carnes y Pollo", icon: "🥩" },
  { id: "pescados", label: "Atún y Huevos", icon: "🐟" }
];

// Guía de porciones por edad para cada plato
const PORTION_GUIDE = {
  adult: { label: "Adulto", protein: "140 - 160g", carb: "100 - 130g", veg: "120 - 150g", desc: "Plato equilibrado que sacia sin pesadez." },
  teen: { label: "Hijo de 13 años", protein: "150 - 180g", carb: "140 - 180g", veg: "100 - 120g", desc: "Etapa de estirón: mayor requerimiento de carbohidratos y energía limpia." },
  kid: { label: "Hijo de 4 años", protein: "50 - 70g", carb: "60 - 80g", veg: "50 - 70g", desc: "Porción pequeña y atractiva; cortar todo en bocados fáciles." }
};

const RECIPES_DATA = [
  // =========================================================================
  // SECCIÓN 1: LOS MÓDULOS BASE (BATCH COOKING)
  // =========================================================================
  {
    id: "mod-1",
    title: "Módulo 1: Asadera de Verduras Doradas",
    subtitle: "La base vegetal de la semana: cebolla, morrón, zanahoria y calabaza",
    category: "modulos",
    tags: ["Base Semanal", "Verduras", "Ahorra Tiempo"],
    prepTime: 10,
    cookTime: 25,
    servings: 6,
    difficulty: "Muy Fácil",
    calories: 85,
    macros: { protein: "2g", carbs: "16g", fat: "2g" },
    icon: "🥕",
    color: "#EA580C",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "130g en plato (1 taza generosa)",
      teen: "110g en plato",
      kid: "60g bien picadita o procesada en salsa"
    },
    ingredients: [
      { item: "Cebollas grandes cortadas en tiras gruesas", qty: "3 unidades" },
      { item: "Morrones rojos o verdes sin semillas en tiras", qty: "2 unidades" },
      { item: "Zanahorias medianas peladas y en rodajas finas", qty: "3 unidades" },
      { item: "Calabaza o zapallo anco en cubitos de 2 cm", qty: "1/2 unidad (500g)" },
      { item: "Aceite de girasol o maíz", qty: "2 cucharadas soperas" },
      { item: "Orégano seco, sal fina y pimienta", qty: "Al gusto" }
    ],
    steps: [
      "Precalienta el horno a temperatura fuerte (200°C).",
      "En una asadera grande de horno, distribuye toda la verdura picada en una sola capa pareja.",
      "Rocía con las 2 cucharadas de aceite, sal y orégano. Mezcla con las manos para que todo quede apenas engrasado.",
      "Lleva al horno por 25 minutos. A mitad de tiempo, remueve una vez con cuchara de madera.",
      "Cuando los bordes estén tiernos y doraditos, apaga el horno, deja enfriar y guarda en un tupper hermético en la heladera (dura 4 a 5 días)."
    ],
    tips: "No pongas la verdura apilada para que se dore y caramelice en vez de hervirse en su propio vapor.",
    timerMinutes: 25
  },
  {
    id: "mod-2",
    title: "Módulo 2: Tiras de Pollo y Carne Selladas",
    subtitle: "Proteína tierna y sazonada lista en tupper para ensaladas, fajitas o wok",
    category: "modulos",
    tags: ["Base Semanal", "Proteína", "Pollo / Carne"],
    prepTime: 10,
    cookTime: 12,
    servings: 5,
    difficulty: "Fácil",
    calories: 190,
    macros: { protein: "32g", carbs: "1g", fat: "6g" },
    icon: "🍗",
    color: "#16A34A",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "140g a 160g de carne cocida",
      teen: "160g a 180g (necesita mucha proteína para crecer)",
      kid: "60g bien cortadita en cubitos chicos"
    },
    ingredients: [
      { item: "Pechugas de pollo o pulpa/nalga de carne vacuna", qty: "1 kg" },
      { item: "Aceite para la sartén", qty: "1 cucharada" },
      { item: "Pimentón dulce, provenzal (ajo y perejil) y sal", qty: "1 cucharadita cada uno" },
      { item: "Jugo de 1/2 limón", qty: "1 chorrito" }
    ],
    steps: [
      "Corta la carne o pechuga en tiritas de tamaño bocado.",
      "Sazona en un bowl con la sal, el pimentón dulce, la provenzal y el jugo de limón.",
      "Calienta una sartén o plancha grande a fuego fuerte con una cucharada de aceite.",
      "Cocina en dos tandas para que la sartén no pierda calor: 5 a 6 minutos por tanda moviendo hasta dorar por fuera y que quede jugosa adentro.",
      "Deja enfriar y guarda en tupper en la heladera. ¡Proteína lista para toda la semana!"
    ],
    tips: "El secreto para que no quede como 'suela' es el fuego fuerte y cocinar en tandas chicas sin amontonar.",
    timerMinutes: 12
  },
  {
    id: "mod-3",
    title: "Módulo 3: Arroz Blanco Graneado Perfecto",
    subtitle: "Arroz suelto y firme que dura 4 días en heladera sin apelmazarse",
    category: "modulos",
    tags: ["Base Semanal", "Carbohidrato Noble", "Económico"],
    prepTime: 2,
    cookTime: 14,
    servings: 5,
    difficulty: "Fácil",
    calories: 140,
    macros: { protein: "3g", carbs: "30g", fat: "1g" },
    icon: "🍚",
    color: "#0284C7",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "120g cocido (1 taza mediana)",
      teen: "160g cocido",
      kid: "70g cocido"
    },
    ingredients: [
      { item: "Arroz común largo fino o parboil", qty: "300g (1 taza y media)" },
      { item: "Agua caliente", qty: "3 tazas" },
      { item: "Diente de ajo aplastado con la piel", qty: "1 unidad" },
      { item: "Aceite", qty: "1 cucharadita" },
      { item: "Sal fina", qty: "1 cucharadita colmada" }
    ],
    steps: [
      "En una olla a fuego medio coloca la cucharadita de aceite y el ajo aplastado para que perfume 30 segundos.",
      "Agrega el arroz en seco y 'nacara' (revuélvelo 1 minuto hasta que los granos se vean brillantes).",
      "Vierte el agua caliente y la sal. Revuelve una sola vez.",
      "Baja el fuego a mínimo, tapa la olla y cocina durante 13 a 14 minutos sin destapar ni revolver.",
      "Apaga el fuego, destapa, revuelve suavemente con un tenedor para ahuecarlo y déjalo enfriar antes de guardar en tupper."
    ],
    tips: "No lo revuelvas mientras hierve para que no suelte almidón y quede bien suelto granito por granito.",
    timerMinutes: 14
  },
  {
    id: "mod-4",
    title: "Módulo 4: Papas Hervidas con Piel para Puré o Salteado",
    subtitle: "Cocínalas enteras para que conserven sabor y nutrientes toda la semana",
    category: "modulos",
    tags: ["Base Semanal", "Papa", "Versátil"],
    prepTime: 5,
    cookTime: 20,
    servings: 4,
    difficulty: "Muy Fácil",
    calories: 120,
    macros: { protein: "3g", carbs: "26g", fat: "0g" },
    icon: "🥔",
    color: "#D97706",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "1 papa mediana (150g)",
      teen: "1 papa y media (200g)",
      kid: "1/2 papa (80g)"
    },
    ingredients: [
      { item: "Papas medianas lavadas bien con cepillo", qty: "1 kg (4 a 5 unidades)" },
      { item: "Agua y un puñadito de sal gruesa", qty: "Cantidad necesaria" }
    ],
    steps: [
      "Lava bien las papas bajo el agua para sacar la tierra, dejándoles la cáscara.",
      "Colócalas en una olla grande cubiertas de agua fría con la sal gruesa.",
      "Lleva a fuego medio-alto. Una vez que rompa el hervor, cocina durante unos 18 a 20 minutos.",
      "Pincha con un cuchillo: si entra fácil en el centro, apaga y retira del agua enseguida para que no absorban líquido demás.",
      "Guárdalas enteras en la heladera. Te servirán para pisar y hacer puré, cortar en rodajas para salteados o mezclar con atún."
    ],
    tips: "Cocinarlas con cáscara hace que queden secas y cremosas por dentro, ideales para dorar después en sartén.",
    timerMinutes: 20
  },
  {
    id: "mod-5",
    title: "Módulo 5: Masa Casera Express para Tacos o Tartas",
    subtitle: "Con harina común o integral, agua y aceite. ¡Dile adiós a las tapas compradas!",
    category: "modulos",
    tags: ["Masa Casera", "Sin Conservantes", "Rápido"],
    prepTime: 8,
    cookTime: 0,
    servings: 6,
    difficulty: "Fácil",
    calories: 160,
    macros: { protein: "4g", carbs: "28g", fat: "4g" },
    icon: "🫓",
    color: "#B45309",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 fajitas o 1 porción de tarta",
      teen: "2 a 3 fajitas",
      kid: "1 fajita cortada al medio"
    },
    ingredients: [
      { item: "Harina común o mezcla con harina integral", qty: "300g (2 tazas)" },
      { item: "Aceite de girasol", qty: "3 cucharadas soperas" },
      { item: "Agua tibia", qty: "150ml aprox" },
      { item: "Sal fina", qty: "1 cucharadita" }
    ],
    steps: [
      "En un bowl mezcla la harina y la sal. Haz un hueco en el centro.",
      "Agrega el aceite y el agua tibia de a poco, uniendo con un tenedor o con la mano.",
      "Amasa 2 minutos sobre la mesada hasta tener un bollo suave que no se pegue en los dedos.",
      "Tapa con un trapo o bolsa y guarda en la heladera (aguanta 3 días cruda).",
      "Para hacer fajitas: divide en 6 bollitos, estira fino con palo de amasar y cocínalas en sartén caliente 1 minuto por lado sin aceite."
    ],
    tips: "Salen infinitamente más ricas, flexibles y baratas que las 'Rapiditas' de paquete del supermercado.",
    timerMinutes: 5
  },

  // =========================================================================
  // SECCIÓN 2: PLATOS DE 10 MINUTOS (ENSAMBLAJE EN LA SEMANA)
  // =========================================================================
  {
    id: "ens-1",
    title: "Wok Express de Arroz, Pollo y Huevo",
    subtitle: "El favorito de los chicos: juntar los módulos en una sartén caliente",
    category: "ensambles",
    tags: ["10 Minutos", "Súper Rendidor", "Para los Chicos"],
    prepTime: 3,
    cookTime: 6,
    servings: 3,
    difficulty: "Muy Fácil",
    calories: 380,
    macros: { protein: "30g", carbs: "42g", fat: "10g" },
    icon: "🥢",
    color: "#DC2626",
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "320g total en el plato",
      teen: "380g total en el plato (plato hondo bien colmado)",
      kid: "160g total en plato infantil"
    },
    ingredients: [
      { item: "Arroz cocido del Módulo 3", qty: "3 tazas (de la heladera)" },
      { item: "Tiritas de pollo del Módulo 2", qty: "2 tazas" },
      { item: "Verduras asadas del Módulo 1", qty: "1 taza colmada" },
      { item: "Huevos enteros", qty: "2 unidades" },
      { item: "Aceite", qty: "1 cucharadita" },
      { item: "Salsa de soja o sal", qty: "1 cucharada a gusto" }
    ],
    steps: [
      "Calienta una sartén o wok grande con un chorrito de aceite a fuego vivo.",
      "Echa el arroz frío y las verduras asadas. Saltea durante 2 minutos hasta que tomen calor.",
      "Empuja el arroz hacia los bordes haciendo un hueco en el centro del sartén. Rompe los dos huevos en ese hueco y revuelve con cuchara hasta que se cocinen como huevo revuelto.",
      "Incorpora el pollo ya cocinado y mezcla todo junto en la sartén.",
      "Agrega la cucharada de salsa de soja, mezcla 1 minuto más y sirve hirviendo en platos hondos."
    ],
    tips: "El arroz de la heladera frío es mil veces mejor para saltear que el recién hervido porque no se rompe.",
    timerMinutes: 6
  },
  {
    id: "ens-2",
    title: "Fajitas Calentitas con Pollo, Verduras y Queso",
    subtitle: "Cena divertida para comer con la mano que a los pibes les fascina",
    category: "ensambles",
    tags: ["Fajitas", "Para Comer con la Mano", "Cena Rápida"],
    prepTime: 5,
    cookTime: 5,
    servings: 3,
    difficulty: "Fácil",
    calories: 360,
    macros: { protein: "28g", carbs: "35g", fat: "12g" },
    icon: "🌯",
    color: "#059669",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 fajitas completas",
      teen: "2 a 3 fajitas completas bien cargadas",
      kid: "1 fajita cortada al medio (con menos relleno para no desarmarse)"
    },
    ingredients: [
      { item: "Masitas caseras del Módulo 5 (o tortillas)", qty: "6 unidades" },
      { item: "Pollo en tiras del Módulo 2", qty: "250g caliente" },
      { item: "Verduras asadas del Módulo 1 (cebolla y morrón)", qty: "1 taza caliente" },
      { item: "Queso cremoso o muzarella en tiras", qty: "120g" }
    ],
    steps: [
      "En una sartén bien caliente tuesta cada masita 30 a 40 segundos por lado hasta que inflen ligeramente.",
      "Mientras tanto, calienta en el microondas o en otra sartén el pollo junto con las verduras asadas.",
      "Sobre cada masa caliente, coloca una tira de queso cremoso para que se derrita con el calor.",
      "Añade encima dos cucharadas generosas de la mezcla de pollo con verduras.",
      "Enrolla doblando la base hacia arriba y disfruta caliente."
    ],
    tips: "Para el nene de 4 años, corta la masa en triángulos para que coma 'taquitos' con las manos sin que se le caiga el relleno.",
    timerMinutes: 5
  },
  {
    id: "ens-3",
    title: "Pastel de Papas Express en 10 Minutos",
    subtitle: "Pisas la papa cocida, agregas la carne con verduras y solo gratinas el queso",
    category: "ensambles",
    tags: ["Clásico Argentino", "Reconfortante", "Fácil"],
    prepTime: 5,
    cookTime: 8,
    servings: 4,
    difficulty: "Fácil",
    calories: 390,
    macros: { protein: "26g", carbs: "38g", fat: "14g" },
    icon: "🥧",
    color: "#B45309",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "300g (1 cuadrado generoso de la fuente)",
      teen: "350g (con huevo duro picado arriba)",
      kid: "150g tibio"
    },
    ingredients: [
      { item: "Papas hervidas del Módulo 4", qty: "3 unidades peladas" },
      { item: "Carne picada dorada o carne en tiritas", qty: "350g" },
      { item: "Verduras asadas del Módulo 1 (bien picaditas)", qty: "1 taza" },
      { item: "Leche tibia", qty: "3 cucharadas" },
      { item: "Manteca o chorrito de aceite", qty: "1 cucharadita" },
      { item: "Queso cremoso o rallado para gratinar", qty: "100g" }
    ],
    steps: [
      "En un bowl pisa las papas hervidas con la leche tibia, manteca, sal y una pizca de nuez moscada hasta tener un puré sedoso.",
      "Mezcla la carne con las verduras asadas y calienta 1 minuto en sartén o microondas.",
      "En una fuente apta para horno o en platos hondos térmicos, pon la base de carne con verdura.",
      "Cubre por encima con la capa de puré de papas y marca con un tenedor para hacer surcos decorativos.",
      "Coloca el queso por encima y lleva al horno fuerte o grill durante 6 a 8 minutos hasta que el queso esté derretido y burbujeante."
    ],
    tips: "Como todos los ingredientes ya estaban cocidos en la heladera, no necesitas 40 minutos de horno como el pastel tradicional: en 8 min está listo.",
    timerMinutes: 8
  },
  {
    id: "ens-4",
    title: "Medallones Crocantes de Atún, Papa y Cebolla",
    subtitle: "Económicos, sabrosos y una forma genial de que los chicos coman pescado",
    category: "pescados",
    tags: ["Económico", "Pescado para Chicos", "Crocante"],
    prepTime: 8,
    cookTime: 8,
    servings: 3,
    difficulty: "Muy Fácil",
    calories: 280,
    macros: { protein: "24g", carbs: "22g", fat: "9g" },
    icon: "🐟",
    color: "#0284C7",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 medallones grandes",
      teen: "2 a 3 medallones",
      kid: "1 medallón chico"
    },
    ingredients: [
      { item: "Atún al natural o en aceite escurrido", qty: "2 latas (240g total)" },
      { item: "Papas hervidas del Módulo 4 pisadas", qty: "2 unidades medianas" },
      { item: "Huevo fresco", qty: "1 unidad" },
      { item: "Cebollita salteada o del Módulo 1 bien picada", qty: "2 cucharadas" },
      { item: "Harina común o pan rallado para rebozar", qty: "3 cucharadas" },
      { item: "Sal fina y orégano", qty: "Al gusto" }
    ],
    steps: [
      "En un bowl aplasta las papas con tenedor. Añade el atún bien escurrido y desmenuzado.",
      "Agrega el huevo, la cebolla picadita, sal y orégano. Mezcla bien hasta que quede una masa consistente.",
      "Forma 6 medallones redondos con las manos y pásalos suavemente por una fina capa de harina o pan rallado.",
      "Calienta una sartén con un hilo de aceite a fuego medio.",
      "Cocina los medallones durante 3 a 4 minutos por lado hasta que queden con una costra dorada y crocante.",
      "Acompaña con rodajas de tomate fresco y ensalada de lechuga."
    ],
    tips: "No uses puré aguado; cuanto más seca esté la papa hervida, más firmes quedan los medallones sin desarmarse.",
    timerMinutes: 8
  },
  {
    id: "ens-5",
    title: "Fideos con Crema de Verduras Asadas y Pollo",
    subtitle: "Una salsa naranja deliciosa que camufla toda la verdura para los chicos",
    category: "ensambles",
    tags: ["Fideos Ricos", "Verdura Camuflada", "Fácil"],
    prepTime: 4,
    cookTime: 8,
    servings: 4,
    difficulty: "Fácil",
    calories: 410,
    macros: { protein: "28g", carbs: "54g", fat: "9g" },
    icon: "🍝",
    color: "#EA580C",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "250g en el plato",
      teen: "320g (plato generoso con queso)",
      kid: "140g cortando los fideos cortitos"
    },
    ingredients: [
      { item: "Fideos secos guiseros o moñitos", qty: "350g" },
      { item: "Verduras asadas del Módulo 1 (zanahoria, calabaza, cebolla)", qty: "1 taza y media" },
      { item: "Leche o queso crema", qty: "4 cucharadas soperas" },
      { item: "Pollo en tiras del Módulo 2", qty: "1 taza y media" },
      { item: "Sal y queso rallado", qty: "Al gusto" }
    ],
    steps: [
      "Pon a hervir los fideos en abundante agua con sal durante 8 a 9 minutos.",
      "Mientras hierven, coloca en el vaso de la licuadora o minipimer las verduras asadas con las 4 cucharadas de leche/queso crema y una pizca de sal.",
      "Procesa durante 1 minuto hasta obtener una salsa súper cremosa, suave y de color naranja intenso.",
      "Cuela los fideos dejando apenas 2 cucharadas del agua de cocción en la olla.",
      "Vierte la salsa de verduras y el pollo desmenuzado en la olla con los fideos calientes, remueve 1 minuto a fuego suave y sirve con lluvia de queso rallado."
    ],
    tips: "Al procesar la calabaza y la zanahoria con queso crema, toma la textura y el sabor de una salsa cheddar suave que los chicos devoran sin sospechar.",
    timerMinutes: 9
  },
  {
    id: "ens-6",
    title: "Salteado de Cerdo en Tiras con Papas Doradas y Cebolla",
    subtitle: "Corte de cerdo económico, tierno y con mucho sabor criollo",
    category: "carnes",
    tags: ["Cerdo", "Económico", "Sabor Criollo"],
    prepTime: 5,
    cookTime: 10,
    servings: 3,
    difficulty: "Fácil",
    calories: 390,
    macros: { protein: "33g", carbs: "28g", fat: "16g" },
    icon: "🥩",
    color: "#B91C1C",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "280g de plato",
      teen: "340g de plato",
      kid: "140g con la carne bien tierna cortada chiquita"
    },
    ingredients: [
      { item: "Pulpa, bondiola o carré de cerdo en tiritas finas", qty: "450g" },
      { item: "Papas hervidas del Módulo 4 cortadas en cubos", qty: "2 unidades" },
      { item: "Cebollas y morrones del Módulo 1 (o crudas)", qty: "1 taza" },
      { item: "Aceite", qty: "1 cucharada" },
      { item: "Orégano, pimentón y sal", qty: "Al gusto" }
    ],
    steps: [
      "Calienta bien la sartén con la cucharada de aceite.",
      "Agrega las tiritas de cerdo y dóralas a fuego fuerte durante 4 a 5 minutos hasta que tomen buen color.",
      "Añade los cubos de papa hervida y las verduras salteadas. Las papas se dorarán por fuera con los jugos del cerdo en 3 minutos.",
      "Condimenta con pimentón, orégano y sal.",
      "Sirve de inmediato bien caliente."
    ],
    tips: "El cerdo debe cocinarse a fuego fuerte para que quede bien dorado pero sin secarlo de más.",
    timerMinutes: 10
  },

  // =========================================================================
  // SECCIÓN 3: GALLETITAS Y SNACKS CASEROS PARA LOS CHICOS
  // =========================================================================
  {
    id: "gal-1",
    title: "Pepas Caseras de Membrillo con Harina Leudante o Integral",
    subtitle: "Rinden 25 pepas riquísimas en 15 minutos para la merienda o mochila",
    category: "galletitas",
    tags: ["Para la Escuela", "Económicas", "Sin Grasa Trans"],
    prepTime: 10,
    cookTime: 12,
    servings: 8,
    difficulty: "Muy Fácil",
    calories: 110,
    macros: { protein: "2g", carbs: "20g", fat: "3g" },
    icon: "🍪",
    color: "#E11D48",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 a 3 pepas con mate o café",
      teen: "3 a 4 pepas para la merienda",
      kid: "2 pepas en la lunchera del cole"
    },
    ingredients: [
      { item: "Harina leudante (o harina común con 1 cdta polvo de hornear)", qty: "250g (2 tazas)" },
      { item: "Huevo", qty: "1 unidad" },
      { item: "Aceite de girasol (en vez de manteca)", qty: "5 cucharadas soperas (50ml)" },
      { item: "Azúcar común o mascabo", qty: "60g (3 a 4 cucharadas)" },
      { item: "Esencia de vainilla o ralladura de limón", qty: "1 cucharadita" },
      { item: "Dulce de membrillo cortado en cubitos pequeños", qty: "120g" },
      { item: "Agua caliente para derretir el membrillo", qty: "1 cucharadita" }
    ],
    steps: [
      "En un bowl bate con tenedor el huevo, el azúcar, el aceite y la vainilla durante 1 minuto.",
      "Agrega la harina de a poco y une con la mano hasta formar una masa suave que no se pegue (no hace falta amasar mucho).",
      "Haz 20 a 25 bolitas del tamaño de una nuez y colócalas en una asadera apenas engrasada.",
      "Húndeles el dedo pulgar en el centro para hacerles el hueco característico.",
      "Pisa el dulce de membrillo con una cucharadita de agua caliente en un platito hasta que quede como una pasta maleable.",
      "Rellena cada hueco con media cucharadita de dulce.",
      "Lleva al horno precalentado a 180°C durante solo 10 a 12 minutos (deben quedar blanquitas arriba y con la base doradita).",
      "Deja enfriar y guarda en un frasco de vidrio: duran 1 semana intactas."
    ],
    tips: "No las dejes pasar de 12 minutos en el horno; si se doran de más quedan duras, tienen que salir tiernas.",
    timerMinutes: 12
  },
  {
    id: "gal-2",
    title: "Galletitas Suaves de Avena y Manzana o Banana",
    subtitle: "Se mezclan con tenedor en 5 minutos, sin harina refinada y sin azúcar agregada",
    category: "galletitas",
    tags: ["Sin Azúcar", "Fibra", "Avena"],
    prepTime: 6,
    cookTime: 14,
    servings: 6,
    difficulty: "Muy Fácil",
    calories: 90,
    macros: { protein: "3g", carbs: "16g", fat: "2g" },
    icon: "🍎",
    color: "#16A34A",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 galletas",
      teen: "3 galletas",
      kid: "1 a 2 galletas (ideales para el de 4 años por su textura suave)"
    },
    ingredients: [
      { item: "Bananas maduras o 1 manzana rallada fina", qty: "2 unidades" },
      { item: "Avena tradicional o instantánea", qty: "150g (1 taza y media)" },
      { item: "Canela molida", qty: "1/2 cucharadita" },
      { item: "Chips de chocolate o nueces picadas (opcional)", qty: "2 cucharadas" }
    ],
    steps: [
      "En un bowl pisa bien las bananas con un tenedor hasta que quede un puré líquido.",
      "Incorpora la avena y la canela. Mezcla con cuchara y deja reposar 3 minutos para que la avena absorba la humedad.",
      "Si quieres, añade los chips de chocolate.",
      "Toma porciones con una cuchara y colócalas aplastadas sobre una asadera aceitada formando galletas redondas.",
      "Hornea a 180°C durante 12 a 14 minutos hasta que los bordes estén firmes y dorados.",
      "Deja enfriar sobre una rejilla."
    ],
    tips: "Al nene de 4 años le encantan porque no son crocantes duras, sino esponjosas y fáciles de masticar.",
    timerMinutes: 13
  },
  {
    id: "gal-3",
    title: "Galletitas Caseras de Chocolate Tipo 'Chocolinas'",
    subtitle: "Riquísimas para la merienda con leche, hechas en casa con ingredientes limpios",
    category: "galletitas",
    tags: ["Chocolate", "Para Chicos", "Tentación"],
    prepTime: 8,
    cookTime: 10,
    servings: 8,
    difficulty: "Fácil",
    calories: 125,
    macros: { protein: "3g", carbs: "18g", fat: "4g" },
    icon: "🍫",
    color: "#78350F",
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
    portionWeights: {
      adult: "2 galletitas",
      teen: "3 a 4 galletitas con leche",
      kid: "2 galletitas"
    },
    ingredients: [
      { item: "Harina leudante", qty: "200g (1 taza y media)" },
      { item: "Cacao amargo en polvo", qty: "40g (3 cucharadas colmadas)" },
      { item: "Azúcar", qty: "70g (4 cucharadas)" },
      { item: "Aceite de girasol", qty: "4 cucharadas soperas" },
      { item: "Huevo", qty: "1 unidad" },
      { item: "Chorrito de leche o agua", qty: "2 cucharadas si hace falta ligar" }
    ],
    steps: [
      "En un bowl mezcla el huevo, azúcar y aceite.",
      "Agrega la harina y el cacao tamizados. Une con las manos hasta formar una masa de chocolate oscura y maleable.",
      "Estira la masa con palo de amasar sobre la mesada enharinada (de unos 3 mm de espesor).",
      "Corta con cuchillo o cortante en rectángulos o círculos.",
      "Pincha cada galletita con un tenedor para darles el clásico aspecto de galleta comprada.",
      "Coloca en asadera y hornea a 180°C durante solo 8 a 10 minutos.",
      "Al sacarlas parecen apenas blanditas, pero al enfriarse 5 minutos quedan crujientes y deliciosas."
    ],
    tips: "Si las guardas en lata o frasco hermético, duran 10 días perfectas y crujientes para mandarle al cole.",
    timerMinutes: 10
  }
];

// Plan de compras semanal estimado para 1 Adulto + 2 Hijos (13 y 4 años)
const WEEKLY_GROCERY_LIST = {
  carniceria: [
    { item: "Pechuga o suprema de pollo limpia", qty: "1.2 kg" },
    { item: "Carne vacuna magra (pulpa, nalga o picada especial)", qty: "800g" },
    { item: "Corte de cerdo (pulpa, bondiola o carré)", qty: "600g" }
  ],
  verduleria: [
    { item: "Papas medianas", qty: "2 kg" },
    { item: "Calabaza o zapallo anco", qty: "1 unidad mediana (1.5 kg)" },
    { item: "Cebollas", qty: "1.5 kg" },
    { item: "Morrones rojos", qty: "3 unidades" },
    { item: "Zanahorias", qty: "1 kg" },
    { item: "Tomates redondos para ensalada", qty: "1 kg" },
    { item: "Planta de lechuga", qty: "1 unidad" },
    { item: "Bananas maduras para las galletitas", qty: "1 kg" }
  ],
  supermercado: [
    { item: "Huevos frescos", qty: "1 maple o 18 unidades" },
    { item: "Atún en lata (al natural o aceite)", qty: "3 latas" },
    { item: "Arroz largo fino o parboil", qty: "1 paquete (1 kg)" },
    { item: "Fideos secos guiseros o moñitos", qty: "1 paquete (500g)" },
    { item: "Harina leudante", qty: "1 paquete" },
    { item: "Harina común o integral", qty: "1 paquete" },
    { item: "Avena tradicional o instantánea", qty: "1 bolsita (400g)" },
    { item: "Dulce de membrillo en barra", qty: "1 pan chico (250g)" },
    { item: "Cacao amargo en polvo", qty: "1 cajita o sobre (100g)" },
    { item: "Queso cremoso o muzarella", qty: "400g" }
  ]
};
