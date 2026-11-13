export type StructureType = 'bone' | 'muscle';
export type AnatomicalView = 'front' | 'back' | 'both';
export type BodySegment =
  | 'head'
  | 'neck'
  | 'torso'
  | 'pelvis'
  | 'upper_arm'
  | 'forearm'
  | 'hand'
  | 'thigh'
  | 'lower_leg'
  | 'foot';
export type Sidedness = 'bilateral' | 'midline';
export type NameLanguage = 'de' | 'en' | 'la';
export type UILanguage = 'de' | 'en';

export interface AnatomyStructure {
  id: string;
  type: StructureType;
  names: {
    la: string;
    de: string;
    en: string;
  };
  descriptions: {
    de: string;
    en: string;
  };
  view: AnatomicalView;
  segment: BodySegment;
  artworkRef: string;
  sidedness: Sidedness;
  layerOrder: number; // 1 = deep, 2 = intermediate, 3 = superficial
}

/**
 * Single source of truth for all 136 anatomical structures (104 muscles/myofascial
 * structures + 32 bones & physio bony landmarks).
 */
export const ANATOMY_STRUCTURES: readonly AnatomyStructure[] = [
  // =========================================================================
  // A. MUSCLES & MYOFASCIAL STRUCTURES (104)
  // =========================================================================

  // 1. Head & Neck (10)
  {
    id: 'm_frontalis',
    type: 'muscle',
    names: {
      la: 'Venter frontalis (M. occipitofrontalis)',
      de: 'Stirnmuskel',
      en: 'Frontalis'
    },
    descriptions: {
      de: 'Dünner mimischer Muskel über dem Stirnbein, der über die Galea aponeurotica mit dem Hinterhauptmuskel verbunden ist. Er hebt die Augenbrauen und legt die Stirn in Querfalten, oft ein Indikator für Anspannung im Nacken-Kopf-Bereich.',
      en: 'Thin facial muscle covering the frontal bone, connected via the epicranial aponeurosis to the occipital belly. It elevates the eyebrows and wrinkles the forehead, frequently holding tension alongside neck strain.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'm_frontalis',
    sidedness: 'midline',
    layerOrder: 3
  },
  {
    id: 'm_orbicularis_oculi',
    type: 'muscle',
    names: {
      la: 'M. orbicularis oculi',
      de: 'Augenringmuskel',
      en: 'Orbicularis oculi'
    },
    descriptions: {
      de: 'Ringförmig um die Augenhöhle verlaufender Schließmuskel des Auges. Er schützt den Augapfel durch den Lidschluss und unterstützt den Tränenabfluss bei konzentrierter Belastung.',
      en: 'Circular sphincter muscle surrounding the orbital rim and eyelids. It closes the eye to protect the cornea and assists tear drainage during facial expression.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'm_orbicularis_oculi',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_zygomaticus_major',
    type: 'muscle',
    names: {
      la: 'M. zygomaticus major',
      de: 'Großer Jochbeinmuskel',
      en: 'Zygomaticus major'
    },
    descriptions: {
      de: 'Verläuft schräg vom Jochbein (Os zygomaticum) zum Mundwinkel. Er zieht den Mundwinkel nach oben außen und stabilisiert die seitliche Wangenmuskulatur.',
      en: 'Runs diagonally from the zygomatic bone to the corner of the mouth. It draws the angle of the mouth superiorly and laterally during smiling and cheek stabilization.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'm_zygomaticus_major',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_temporalis',
    type: 'muscle',
    names: {
      la: 'M. temporalis',
      de: 'Schläfenmuskel',
      en: 'Temporalis'
    },
    descriptions: {
      de: 'Fächerförmiger Kaumuskel in der Schläfengrube, der am Unterkieferfortsatz ansetzt. Er hebt und zieht den Unterkiefer zurück und ist häufig bei Zähneknirschen (Bruxismus) oder Spannungskopfschmerz hyperton.',
      en: 'Fan-shaped masticatory muscle occupying the temporal fossa and inserting onto the coronoid process of the mandible. It elevates and retracts the jaw and is commonly overactive in bruxism and tension headaches.'
    },
    view: 'both',
    segment: 'head',
    artworkRef: 'm_temporalis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_masseter',
    type: 'muscle',
    names: {
      la: 'M. masseter',
      de: 'Kaumuskel',
      en: 'Masseter'
    },
    descriptions: {
      de: 'Kräftiger, rechteckiger Muskel zwischen Jochbogen und Unterkieferwinkel. Als stärkster Kieferschließer erzeugt er hohe Beißkräfte und spielt in der Physiotherapie bei craniomandibulärer Dysfunktion (CMD) eine zentrale Rolle.',
      en: 'Thick, rectangular muscle spanning from the zygomatic arch to the angle of the mandible. As a primary jaw elevator, it generates powerful bite force and is a key palpation target in temporomandibular dysfunction (TMD).'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'm_masseter',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_orbicularis_oris',
    type: 'muscle',
    names: {
      la: 'M. orbicularis oris',
      de: 'Mundringmuskel',
      en: 'Orbicularis oris'
    },
    descriptions: {
      de: 'Zirkulärer Muskelkomplex rund um die Mundöffnung und in den Lippen. Er schließt und spitzt die Lippen und wirkt beim forcierten Ausatmen oder Pressen unterstützend.',
      en: 'Complex circular muscle encircling the mouth within the lips. It closes, protrudes, and compresses the lips during speech and forceful exhalation.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'm_orbicularis_oris',
    sidedness: 'midline',
    layerOrder: 3
  },
  {
    id: 'm_sternocleidomastoideus',
    type: 'muscle',
    names: {
      la: 'M. sternocleidomastoideus',
      de: 'Kopfwender',
      en: 'Sternocleidomastoid'
    },
    descriptions: {
      de: 'Markanter schräger Halsmuskel vom Brust- und Schlüsselbein bis zum Warzenfortsatz hinter dem Ohr. Einseitig neigt er den Kopf zur gleichen Seite und dreht ihn zur Gegenseite; beidseitig beugt er den Hals vor und hebt bei fixiertem Kopf den Brustkorb als Atemhilfsmuskel.',
      en: 'Prominent oblique neck muscle running from the sternum and clavicle to the mastoid process behind the ear. Unilaterally it side-bends the head ipsilaterally and rotates it contralaterally; bilaterally it flexes the neck and assists inspiration.'
    },
    view: 'front',
    segment: 'neck',
    artworkRef: 'm_sternocleidomastoideus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_scaleni',
    type: 'muscle',
    names: {
      la: 'Mm. scaleni (anterior, medius, posterior)',
      de: 'Treppenmuskeln',
      en: 'Scalene muscles'
    },
    descriptions: {
      de: 'Dreiteilige tiefe Muskelgruppe seitlich an der Halswirbelsäule mit Ansatz an der ersten und zweiten Rippe. Sie neigen den Hals zur Seite, heben die oberen Rippen bei tiefer Einatmung und bilden die Skalenuslücke für Nerven und Gefäße des Arms.',
      en: 'Three paired lateral neck muscles running from the cervical transverse processes to the first two ribs. They laterally flex the neck, elevate the upper ribs during deep breathing, and form an important neurovascular passage.'
    },
    view: 'front',
    segment: 'neck',
    artworkRef: 'm_scaleni',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_splenius_capitis',
    type: 'muscle',
    names: {
      la: 'M. splenius capitis',
      de: 'Riemenmuskel des Kopfes',
      en: 'Splenius capitis'
    },
    descriptions: {
      de: 'Breiter, riemenförmiger Nackenmuskel unterhalb des Trapezmuskels von den unteren Hals- und oberen Brustwirbeln zum Hinterkopf. Er streckt die Halswirbelsäule und dreht den Kopf zur gleichen Seite.',
      en: 'Broad strap-like posterior neck muscle deep to the trapezius, running from the lower cervical and upper thoracic spinous processes to the mastoid and occiput. It extends the head and neck and rotates the head ipsilaterally.'
    },
    view: 'back',
    segment: 'neck',
    artworkRef: 'm_splenius_capitis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_levator_scapulae',
    type: 'muscle',
    names: {
      la: 'M. levator scapulae',
      de: 'Schulterblattheber',
      en: 'Levator scapulae'
    },
    descriptions: {
      de: 'Verläuft von den Querfortsätzen der oberen vier Halswirbel zum oberen inneren Schulterblattwinkel. Er hebt das Schulterblatt an, dreht es nach innen unten und ist bei Schreibtischhaltung häufig verspannt und schmerzhaft.',
      en: 'Runs from the upper four cervical transverse processes to the superior medial angle of the scapula. It elevates and downwardly rotates the scapula and is one of the most common sites of neck-shoulder trigger points.'
    },
    view: 'back',
    segment: 'neck',
    artworkRef: 'm_levator_scapulae',
    sidedness: 'bilateral',
    layerOrder: 1
  },

  // 2. Torso — Anterior & Lateral (14)
  {
    id: 'm_pectoralis_major_clavicularis',
    type: 'muscle',
    names: {
      la: 'M. pectoralis major (Pars clavicularis)',
      de: 'Oberer Brustmuskel',
      en: 'Upper Pectoralis Major'
    },
    descriptions: {
      de: 'Schlüsselbeinanteil des großen Brustmuskels, der von der medialen Clavicula schräg abwärts zum Oberarmknochen zieht. Er unterstützt besonders das Vorheben (Anteversion) des Arms sowie die horizontale Adduktion wie beim Schrägbankdrücken.',
      en: 'Clavicular head of the pectoralis major running from the medial clavicle obliquely down to the proximal humerus. It drives shoulder flexion, internal rotation, and upward-angled horizontal adduction such as incline pressing.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_pectoralis_major_clavicularis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_pectoralis_major_sternocostalis',
    type: 'muscle',
    names: {
      la: 'M. pectoralis major (Pars sternocostalis)',
      de: 'Mittlerer Brustmuskel',
      en: 'Sternocostal Pectoralis Major'
    },
    descriptions: {
      de: 'Größter Teil des Brustmuskels vom Brustbein und den oberen Rippenknorpeln zur Crista tuberculi majoris des Humerus. Er führt den Arm kraftvoll vor dem Körper zusammen und dreht ihn nach innen.',
      en: 'Largest portion of the pectoralis major originating from the sternum and costal cartilages to insert on the humerus. It powerfully adducts, horizontally adducts, and internally rotates the arm during pushing movements.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_pectoralis_major_sternocostalis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_pectoralis_major_abdominalis',
    type: 'muscle',
    names: {
      la: 'M. pectoralis major (Pars abdominalis)',
      de: 'Unterer Brustmuskel',
      en: 'Lower Pectoralis Major'
    },
    descriptions: {
      de: 'Unterer Faserzug des großen Brustmuskels von der Rektusscheide schräg aufwärts zum Oberarm. Er zieht den erhobenen Arm kraftvoll nach unten vorn, wie bei Dips oder tiefen Kabelzügen.',
      en: 'Inferior fibers of the pectoralis major arising from the anterior rectus sheath and inserting high on the humeral crest. It depresses the shoulder girdle and pulls the arm downward and medially during dips.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_pectoralis_major_abdominalis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_pectoralis_minor',
    type: 'muscle',
    names: {
      la: 'M. pectoralis minor',
      de: 'Kleiner Brustmuskel',
      en: 'Pectoralis minor'
    },
    descriptions: {
      de: 'Tiefer Muskel unter dem M. pectoralis major, der von der 3. bis 5. Rippe zum Rabenschnabelfortsatz (Processus coracoideus) zieht. Er kippt das Schulterblatt nach vorn unten; eine Verkürzung fördert Rundschultern und Engpasssyndrome.',
      en: 'Deep anterior chest muscle lying beneath the pectoralis major from ribs 3–5 to the coracoid process. It protracts and anteriorly tilts the scapula; tightness contributes to rounded-shoulder posture.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_pectoralis_minor',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_subclavius',
    type: 'muscle',
    names: {
      la: 'M. subclavius',
      de: 'Unterschlüsselbeinmuskel',
      en: 'Subclavius'
    },
    descriptions: {
      de: 'Kleiner, tief liegender Muskel zwischen der ersten Rippe und der Unterseite des Schlüsselbeins. Er stabilisiert das Sternoklavikulargelenk und schützt darunterliegende Nerven und Gefäße vor Kompression.',
      en: 'Small deep muscle spanning between the first rib and the inferior surface of the clavicle. It depresses and stabilizes the clavicle at the sternoclavicular joint during arm movements.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_subclavius',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_serratus_anterior',
    type: 'muscle',
    names: {
      la: 'M. serratus anterior',
      de: 'Vorderer Sägemuskel',
      en: 'Serratus anterior'
    },
    descriptions: {
      de: 'Fächerförmiger Muskel mit zackenförmigen Ursprüngen an den oberen neun Rippen und Ansatz am medialen Schulterblattrand. Er drückt das Schulterblatt an den Brustkorb und dreht es bei Überkopfbewegungen nach außen oben.',
      en: 'Serrated muscle originating along the lateral ribs 1–9 and wrapping posteriorly to the medial scapular border. Known as the boxer muscle, it protracts and upwardly rotates the scapula while preventing scapular winging.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_serratus_anterior',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_rectus_abdominis',
    type: 'muscle',
    names: {
      la: 'M. rectus abdominis',
      de: 'Gerader Bauchmuskel',
      en: 'Rectus abdominis'
    },
    descriptions: {
      de: 'Paariger, durch Zwischensehnen (Intersectiones tendineae) gegliederter Muskel vom Brustbein bis zum Schambein. Er beugt den Rumpf nach vorn, kippt das Becken nach hinten und sichert die vordere Rumpfstabilität.',
      en: 'Paired strap-like anterior abdominal wall muscle divided by tendinous intersections from the sternum and ribs 5–7 to the pubis. It flexes the lumbar spine, posteriorly tilts the pelvis, and resists hyperextension.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_rectus_abdominis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_obliquus_externus_abdominis',
    type: 'muscle',
    names: {
      la: 'M. obliquus externus abdominis',
      de: 'Äußerer schräger Bauchmuskel',
      en: 'External abdominal oblique'
    },
    descriptions: {
      de: 'Oberflächlichster seitlicher Bauchmuskel, dessen Fasern wie Hände in Hosentaschen schräg nach vorn unten verlaufen. Er dreht den Rumpf zur Gegenseite, neigt ihn zur gleichen Seite und überträgt Kräfte zwischen Oberkörper und Becken.',
      en: 'Most superficial lateral abdominal muscle with fibers running downward and medially from the lower eight ribs to the iliac crest and linea alba. It rotates the trunk to the opposite side, side-bends ipsilaterally, and braces the core.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_obliquus_externus_abdominis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_obliquus_internus_abdominis',
    type: 'muscle',
    names: {
      la: 'M. obliquus internus abdominis',
      de: 'Innerer schräger Bauchmuskel',
      en: 'Internal abdominal oblique'
    },
    descriptions: {
      de: 'Mittlere Schicht der seitlichen Bauchwand unterhalb des äußeren schrägen Bauchmuskels mit aufsteigendem Faserverlauf. Er dreht den Rumpf zur gleichen Seite und spannt die Lendenfaszie über die Bauchpresse mit.',
      en: 'Intermediate lateral abdominal muscle deep to the external oblique whose fibers fan upward and medially from the iliac crest to the lower ribs. It rotates the trunk ipsilaterally and supports intra-abdominal pressure.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_obliquus_internus_abdominis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_transversus_abdominis',
    type: 'muscle',
    names: {
      la: 'M. transversus abdominis',
      de: 'Querer Bauchmuskel',
      en: 'Transversus abdominis'
    },
    descriptions: {
      de: 'Tiefster, korsettartig horizontal verlaufender Bauchmuskel rund um den Rumpf. Er erhöht den intraabdominalen Druck vor jeder Extremitätenbewegung und schützt die Lendenwirbelsäule vor Scherkräften.',
      en: 'Deepest horizontal layer of the abdominal wall wrapping the trunk like an anatomical weight belt. It increases intra-abdominal pressure to stiffen and protect the lumbar spine during heavy lifting.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_transversus_abdominis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_pyramidalis',
    type: 'muscle',
    names: {
      la: 'M. pyramidalis',
      de: 'Pyramidenmuskel',
      en: 'Pyramidalis'
    },
    descriptions: {
      de: 'Kleiner, dreieckiger Muskel ganz unten in der Rektusscheide direkt über dem Schambein. Er spannt die Linea alba und stabilisiert den unteren Ansatz der Bauchwand.',
      en: 'Small triangular muscle located anterior to the lower rectus abdominis just above the pubic crest. It tenses the linea alba along the lower midline of the abdomen.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_pyramidalis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_intercostales_externi',
    type: 'muscle',
    names: {
      la: 'Mm. intercostales externi',
      de: 'Äußere Zwischenrippenmuskeln',
      en: 'External intercostals'
    },
    descriptions: {
      de: 'Füllen die Räume zwischen den Rippen und verlaufen schräg von oben hinten nach unten vorn. Sie heben die Rippen bei der Einatmung und stabilisieren den Brustkorb gegen Verdrehung.',
      en: 'Muscular sheets spanning the intercostal spaces with fibers angled downward and forward between adjacent ribs. They elevate the rib cage during inhalation and maintain thoracic cage stability.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_intercostales_externi',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_diaphragma',
    type: 'muscle',
    names: {
      la: 'Diaphragma',
      de: 'Zwerchfell',
      en: 'Diaphragm'
    },
    descriptions: {
      de: 'Kuppelförmige Muskel-Sehnen-Platte zwischen Brust- und Bauchhöhle mit Verankerung an Rippen, Brustbein und Lendenwirbeln. Als wichtigster Atemmuskel senkt es sich beim Einatmen ab und bildet das Dach der tiefen Core-Stabilisation.',
      en: 'Dome-shaped musculotendinous partition separating the thoracic and abdominal cavities. As the primary muscle of respiration, it descends on inhalation to draw air in and pressurizes the abdominal canister for core bracing.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_diaphragma',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'm_linea_alba',
    type: 'muscle',
    names: {
      la: 'Linea alba',
      de: 'Weiße Bauchlinie',
      en: 'Linea alba'
    },
    descriptions: {
      de: 'Straffe, kollagenreiche Sehnennaht in der vorderen Körpermitte vom Schwertfortsatz bis zur Schambeinfuge. Sie verbindet die Aponeurosen beider Bauchseiten und überträgt Zugkräfte über die Mittellinie.',
      en: 'Dense fibrous midline raphe stretching from the xiphoid process to the pubic symphysis. It unites the left and right abdominal aponeuroses and transmits lateral core tension across the midline.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_linea_alba',
    sidedness: 'midline',
    layerOrder: 3
  },

  // 3. Torso — Posterior & Shoulder Girdle (17)
  {
    id: 'm_trapezius_descendens',
    type: 'muscle',
    names: {
      la: 'M. trapezius (Pars descendens)',
      de: 'Oberer Trapezmuskel',
      en: 'Upper Trapezius'
    },
    descriptions: {
      de: 'Absteigender oberer Anteil des Kapuzenmuskels vom Hinterkopf und Nackenband zum äußeren Schlüsselbein und Akromion. Er hebt den Schultergürtel, unterstützt die Aufwärtsdrehung des Schulterblatts und neigt den Kopf zur gleichen Seite.',
      en: 'Superior descending fibers of the trapezius running from the occiput and nuchal ligament to the lateral clavicle and acromion. It elevates the shoulder girdle, assists scapular upward rotation, and extends or side-bends the neck.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_trapezius_descendens',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_trapezius_transversa',
    type: 'muscle',
    names: {
      la: 'M. trapezius (Pars transversa)',
      de: 'Mittlerer Trapezmuskel',
      en: 'Middle Trapezius'
    },
    descriptions: {
      de: 'Horizontaler mittlerer Anteil von den oberen Brustwirbeln bis zur Schultergräte (Spina scapulae). Er zieht die Schulterblätter zur Wirbelsäule zusammen (Retraktion) und hält sie beim Rudern stabil.',
      en: 'Horizontal middle fibers running from the lower cervical and upper thoracic spinous processes to the scapular spine. It powerfully retracts the scapula toward the spine during rowing and posture control.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_trapezius_transversa',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_trapezius_ascendens',
    type: 'muscle',
    names: {
      la: 'M. trapezius (Pars ascendens)',
      de: 'Unterer Trapezmuskel',
      en: 'Lower Trapezius'
    },
    descriptions: {
      de: 'Aufsteigender unterer Anteil von der mittleren bis unteren Brustwirbelsäule schräg hoch zur Spina scapulae. Er senkt das Schulterblatt ab und kippt es bei Überkopfbewegungen stabil nach hinten oben.',
      en: 'Inferior ascending fibers running from the lower thoracic spine up to the medial scapular spine. It depresses and upwardly rotates the scapula, counteracting upper trapezius dominance.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_trapezius_ascendens',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_latissimus_dorsi',
    type: 'muscle',
    names: {
      la: 'M. latissimus dorsi',
      de: 'Breiter Rückenmuskel',
      en: 'Latissimus dorsi'
    },
    descriptions: {
      de: 'Flächenmäßig größter Muskel des Rückens mit Ursprung über die Thorakolumbalfaszie an Brustwirbeln, Beckenkamm und unteren Rippen bis zum vorderen Oberarm. Er zieht den Arm kraftvoll nach hinten und unten (Klimmzüge, Rudern) und stabilisiert Rumpf und Schulter.',
      en: 'Broadest muscle of the back spanning from the thoracolumbar fascia, iliac crest, and lower thoracic spine to the anterior humerus. It drives shoulder extension, adduction, and internal rotation in pull-ups and rows.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_latissimus_dorsi',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_rhomboideus_major',
    type: 'muscle',
    names: {
      la: 'M. rhomboideus major',
      de: 'Großer Rautenmuskel',
      en: 'Rhomboid major'
    },
    descriptions: {
      de: 'Liegt tief unter dem mittleren Trapezmuskel zwischen den Dornfortsätzen von T2–T5 und dem inneren Schulterblattrand. Er zieht das Schulterblatt zur Wirbelsäule und leicht nach oben und fixiert es am Brustkorb.',
      en: 'Deep scapular stabilizer beneath the trapezius connecting thoracic spinous processes T2–T5 to the medial scapular border. It retracts, elevates, and downwardly rotates the scapula.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_rhomboideus_major',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_rhomboideus_minor',
    type: 'muscle',
    names: {
      la: 'M. rhomboideus minor',
      de: 'Kleiner Rautenmuskel',
      en: 'Rhomboid minor'
    },
    descriptions: {
      de: 'Schmaler Muskelstrang oberhalb des M. rhomboideus major von C7–T1 zur medialen Basis der Schultergräte. Er arbeitet direkt mit dem großen Rautenmuskel bei der Schulterblattretraktion zusammen.',
      en: 'Narrow band superior to rhomboid major extending from C7–T1 spinous processes to the root of the scapular spine. It assists in pulling the scapula medially and holding it against the thoracic wall.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_rhomboideus_minor',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_teres_major',
    type: 'muscle',
    names: {
      la: 'M. teres major',
      de: 'Großer Rundmuskel',
      en: 'Teres major'
    },
    descriptions: {
      de: 'Kräftiger Muskel vom unteren Schulterblattwinkel bis zur Innenseite des proximalen Oberarms. Als Synergist des Latissimus adduziert, streckt und rotiert er den Oberarm nach innen.',
      en: 'Thick rounded muscle running from the inferior angle of the scapula to the anterior medial humerus. Often called the latissimus helper, it extends, adducts, and internally rotates the shoulder.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_teres_major',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_teres_minor',
    type: 'muscle',
    names: {
      la: 'M. teres minor',
      de: 'Kleiner Rundmuskel',
      en: 'Teres minor'
    },
    descriptions: {
      de: 'Schmaler Muskel der hinteren Rotatorenmanschette vom äußeren Schulterblattrand zum großen Oberarmhöcker. Er dreht den Arm nach außen und zentriert den Oberarmkopf dynamisch in der Schulterpfanne.',
      en: 'Narrow posterior rotator cuff muscle extending from the lateral scapular border to the greater tubercle of the humerus. It externally rotates the arm and stabilizes the humeral head within the glenoid.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_teres_minor',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_infraspinatus',
    type: 'muscle',
    names: {
      la: 'M. infraspinatus',
      de: 'Untergrätenmuskel',
      en: 'Infraspinatus'
    },
    descriptions: {
      de: 'Dreieckiger Hauptmuskel in der Grube unterhalb der Schultergräte mit Ansatz am Tuberculum majus humeri. Als stärkster Außenrotator des Schultergelenks schützt er die vordere Gelenkkapsel bei Wurf- und Drückbelastungen.',
      en: 'Thick triangular rotator cuff muscle filling the infraspinous fossa below the scapular spine. It is the primary external rotator of the shoulder and provides crucial posterior joint stability.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_infraspinatus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_supraspinatus',
    type: 'muscle',
    names: {
      la: 'M. supraspinatus',
      de: 'Obergrätenmuskel',
      en: 'Supraspinatus'
    },
    descriptions: {
      de: 'Liegt in der Grube oberhalb der Schultergräte und zieht unter dem Schulterdach zum großen Oberarmhöcker. Er leitet die Abduktion des Arms ein und hält den Humeruskopf in der Pfanne; seine Sehne ist häufig von Impingement betroffen.',
      en: 'Occupies the supraspinous fossa above the scapular spine and passes beneath the acromion to the humeral head. It initiates arm abduction and compresses the humeral head into the glenoid, making its tendon vulnerable to impingement.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_supraspinatus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_subscapularis',
    type: 'muscle',
    names: {
      la: 'M. subscapularis',
      de: 'Unterschulterblattmuskel',
      en: 'Subscapularis'
    },
    descriptions: {
      de: 'Kräftiger vorderer Teil der Rotatorenmanschette auf der Rippenfläche des Schulterblatts bis zum kleinen Oberarmhöcker. Er ist der stärkste Innenrotator und sichert das Schultergelenk gegen ein Abgleiten nach vorn.',
      en: 'Large anterior rotator cuff muscle lining the costal surface of the scapula and inserting onto the lesser tubercle of the humerus. It drives shoulder internal rotation and resists anterior humeral translation.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'm_subscapularis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_erector_iliocostalis',
    type: 'muscle',
    names: {
      la: 'M. iliocostalis (M. erector spinae)',
      de: 'Darmbein-Rippen-Muskel',
      en: 'Iliocostalis'
    },
    descriptions: {
      de: 'Äußerster Strang des Rückenstreckers vom Beckenkamm und Kreuzbein über alle Rippenwinkel bis in den Nacken. Er streckt und seitneigt die Wirbelsäule und hält den Oberkörper gegen Beugung aufrecht.',
      en: 'Most lateral column of the erector spinae spanning from the iliac crest and sacrum up along the rib angles to the cervical spine. It extends and laterally flexes the spine while resisting trunk flexion.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_erector_iliocostalis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_erector_longissimus',
    type: 'muscle',
    names: {
      la: 'M. longissimus (M. erector spinae)',
      de: 'Längster Rückenmuskel',
      en: 'Longissimus'
    },
    descriptions: {
      de: 'Mittlerer und kräftigster Strang des Rückenstreckers entlang der Querfortsätze vom Kreuzbein bis zum Hinterhaupt. Er sorgt für ausdauernde Aufrichtung der Brust- und Lendenwirbelsäule beim Heben und Gehen.',
      en: 'Intermediate and thickest column of the erector spinae ascending from the sacrum along the transverse processes to the skull. It produces powerful spinal extension and postural endurance.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_erector_longissimus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_erector_spinalis',
    type: 'muscle',
    names: {
      la: 'M. spinalis (M. erector spinae)',
      de: 'Dornmuskel',
      en: 'Spinalis'
    },
    descriptions: {
      de: 'Innerster, direkt neben den Dornfortsätzen verlaufender Anteil des Rückenstreckers. Er streckt vor allem die Brustwirbelsäule und feinjustiert die aufrechte Körperachse.',
      en: 'Most medial column of the erector spinae running closely alongside the spinous processes. It extends the thoracic and cervical spine and supports upright segmental alignment.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_erector_spinalis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_quadratus_lumborum',
    type: 'muscle',
    names: {
      la: 'M. quadratus lumborum',
      de: 'Quadratischer Lendenmuskel',
      en: 'Quadratus lumborum'
    },
    descriptions: {
      de: 'Tiefer, rechteckiger Muskel in der Lendenflanke zwischen hinterem Beckenkamm, Lendenwirbelquerfortsätzen und 12. Rippe. Er neigt den Rumpf seitlich, zieht das Becken hoch (Hip Hike) und stabilisiert die Lende beim einbeinigen Stand.',
      en: 'Deep quadrilateral muscle of the posterior abdominal wall connecting the iliac crest to the 12th rib and lumbar transverse processes. It laterally flexes the spine, hikes the hip, and stabilizes the pelvis during gait and carries.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_quadratus_lumborum',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_multifidi',
    type: 'muscle',
    names: {
      la: 'Mm. multifidi',
      de: 'Vielgespaltene Rückenmuskeln',
      en: 'Multifidus'
    },
    descriptions: {
      de: 'Tiefe, segmentale Muskelbündel entlang der Wirbelbögen und Dornfortsätze, besonders kräftig im Lendenbereich. Sie kontrollieren Mikrobewegungen einzelner Wirbel und sind essenziell für die segmentale Rückenstabilität.',
      en: 'Deep segmental muscles filling the vertebral groove along the spine, thickest in the lumbar region. They provide segmental spinal stiffness, proprioception, and rotational control.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_multifidi',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_fascia_thoracolumbalis',
    type: 'muscle',
    names: {
      la: 'Fascia thoracolumbalis',
      de: 'Brust-Lenden-Faszie',
      en: 'Thoracolumbar fascia'
    },
    descriptions: {
      de: 'Rautenförmige, mehrschichtige Bindegewebsplatte über der Lenden- und unteren Brustwirbelsäule. Sie bündelt Kräfte zwischen Latissimus dorsi, Gluteus maximus und den tiefen Bauchmuskeln wie ein zentraler Kraftknoten.',
      en: 'Diamond-shaped multilayered aponeurotic sheet spanning the lumbar and sacral spine. It mechanically links the latissimus dorsi, gluteus maximus, and deep core muscles to transfer force across the lower back.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'm_fascia_thoracolumbalis',
    sidedness: 'midline',
    layerOrder: 3
  },

  // 4. Upper Arm & Shoulder (11)
  {
    id: 'm_deltoideus_clavicularis',
    type: 'muscle',
    names: {
      la: 'M. deltoideus (Pars clavicularis)',
      de: 'Vorderer Deltamuskel',
      en: 'Anterior Deltoid'
    },
    descriptions: {
      de: 'Vorderer Kopf des Deltamuskels vom äußeren Drittel des Schlüsselbeins zum Oberarmschaft. Er hebt den Arm nach vorn oben (Frontheben, Schulterdrücken) und unterstützt die Innenrotation.',
      en: 'Anterior head of the deltoid arising from the lateral clavicle and inserting on the deltoid tuberosity of the humerus. It performs shoulder flexion, horizontal adduction, and internal rotation during overhead pressing.'
    },
    view: 'front',
    segment: 'upper_arm',
    artworkRef: 'm_deltoideus_clavicularis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_deltoideus_acromialis',
    type: 'muscle',
    names: {
      la: 'M. deltoideus (Pars acromialis)',
      de: 'Seitlicher Deltamuskel',
      en: 'Lateral Deltoid'
    },
    descriptions: {
      de: 'Mittlerer, gefiederter Anteil vom Schulterdach (Acromion) seitlich abwärts zum Oberarm. Er ist der Hauptabspreizer (Abduktor) des Arms ab etwa 15 Grad bis zur Horizontalen und prägt die Schulterbreite.',
      en: 'Multipennate middle head spanning from the acromion down to the lateral humerus. It is the prime mover for shoulder abduction in the scapular and frontal planes.'
    },
    view: 'both',
    segment: 'upper_arm',
    artworkRef: 'm_deltoideus_acromialis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_deltoideus_spinalis',
    type: 'muscle',
    names: {
      la: 'M. deltoideus (Pars spinalis)',
      de: 'Hinterer Deltamuskel',
      en: 'Posterior Deltoid'
    },
    descriptions: {
      de: 'Hinterer Anteil des Deltamuskels von der Schultergräte (Spina scapulae) zum seitlichen Oberarm. Er zieht den Arm nach hinten (Reverse Flys, Face Pulls), dreht ihn nach außen und wirkt dem Rundrücken entgegen.',
      en: 'Posterior head running from the spine of the scapula to the deltoid tuberosity. It drives horizontal abduction, shoulder extension, and external rotation, balancing chest and anterior shoulder dominance.'
    },
    view: 'back',
    segment: 'upper_arm',
    artworkRef: 'm_deltoideus_spinalis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_biceps_caput_longum',
    type: 'muscle',
    names: {
      la: 'M. biceps brachii (Caput longum)',
      de: 'Langer Bizepskopf',
      en: 'Biceps brachii (Long head)'
    },
    descriptions: {
      de: 'Äußerer Kopf des zweiköpfigen Armbeugers, dessen lange Ursprungssehne durch das Schultergelenk zum oberen Pfannenrand läuft. Er beugt und supiniert den Unterarm und stabilisiert gleichzeitig den Oberarmkopf.',
      en: 'Lateral head of the biceps brachii whose long tendon passes through the bicipital groove to the supraglenoid tubercle. It flexes and supinates the forearm while assisting anterior shoulder stability.'
    },
    view: 'front',
    segment: 'upper_arm',
    artworkRef: 'm_biceps_caput_longum',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_biceps_caput_breve',
    type: 'muscle',
    names: {
      la: 'M. biceps brachii (Caput breve)',
      de: 'Kurzer Bizepskopf',
      en: 'Biceps brachii (Short head)'
    },
    descriptions: {
      de: 'Innerer Kopf des Bizeps mit Ursprung am Rabenschnabelfortsatz (Processus coracoideus) und Ansatz an der Speiche. Er beugt den Ellbogen, dreht den Unterarm auswärts (Supination) und unterstützt das Vorheben des Arms.',
      en: 'Medial head of the biceps originating from the coracoid process and merging into the radial tuberosity. It flexes the elbow, supinates the forearm, and assists shoulder flexion.'
    },
    view: 'front',
    segment: 'upper_arm',
    artworkRef: 'm_biceps_caput_breve',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_brachialis',
    type: 'muscle',
    names: {
      la: 'M. brachialis',
      de: 'Armbeuger',
      en: 'Brachialis'
    },
    descriptions: {
      de: 'Kräftiger, tiefer Muskel direkt unter dem Bizeps von der unteren Oberarmvorderseite zur Elle. Er ist das reine Arbeitspferd der Ellbogenbeugung unabhängig von der Unterarmdrehung und drückt den Bizeps optisch nach vorn.',
      en: 'Deep, powerful elbow flexor lying beneath the biceps brachii from the distal humerus to the ulnar tuberosity. It generates maximal elbow flexion torque regardless of forearm pronation or supination.'
    },
    view: 'front',
    segment: 'upper_arm',
    artworkRef: 'm_brachialis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_coracobrachialis',
    type: 'muscle',
    names: {
      la: 'M. coracobrachialis',
      de: 'Hakenarmmuskel',
      en: 'Coracobrachialis'
    },
    descriptions: {
      de: 'Schlanker Muskel an der oberen Innenseite des Oberarms vom Rabenschnabelfortsatz zur Mitte des Oberarmschafts. Er führt den Arm nach vorn und zum Körper heran und schützt das Schultergelenk bei gestrecktem Arm.',
      en: 'Slender medial upper arm muscle running from the coracoid process to the mid-medial shaft of the humerus. It assists shoulder flexion and adduction while stabilizing the shoulder against inferior pull.'
    },
    view: 'front',
    segment: 'upper_arm',
    artworkRef: 'm_coracobrachialis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_triceps_caput_longum',
    type: 'muscle',
    names: {
      la: 'M. triceps brachii (Caput longum)',
      de: 'Langer Trizepskopf',
      en: 'Triceps brachii (Long head)'
    },
    descriptions: {
      de: 'Einziger zweigelenkiger Kopf des Trizeps vom Unterrand der Schulterpfanne bis zum Ellenbogenhöcker (Olecranon). Er streckt den Ellbogen und zieht den erhobenen Oberarm kraftvoll nach hinten unten.',
      en: 'Only biarticular head of the triceps originating at the infraglenoid tubercle of the scapula and inserting onto the olecranon. It extends both the elbow and the shoulder, especially during overhead extensions.'
    },
    view: 'back',
    segment: 'upper_arm',
    artworkRef: 'm_triceps_caput_longum',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_triceps_caput_laterale',
    type: 'muscle',
    names: {
      la: 'M. triceps brachii (Caput laterale)',
      de: 'Seitlicher Trizepskopf',
      en: 'Triceps brachii (Lateral head)'
    },
    descriptions: {
      de: 'Äußerer, gut sichtbarer Muskelkopf an der Rückseite des Oberarms, der den seitlichen Bogen des Hufeisens bildet. Er entwickelt bei hohem Widerstand wie schwerem Bankdrücken oder Dips die größte Schnellkraft in der Ellbogenstreckung.',
      en: 'Superficial lateral head on the posterior humerus forming the outer horseshoe contour. It is recruited strongly for high-force elbow extension during dips, push-ups, and pressdowns.'
    },
    view: 'back',
    segment: 'upper_arm',
    artworkRef: 'm_triceps_caput_laterale',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_triceps_caput_mediale',
    type: 'muscle',
    names: {
      la: 'M. triceps brachii (Caput mediale)',
      de: 'Medialer Trizepskopf',
      en: 'Triceps brachii (Medial head)'
    },
    descriptions: {
      de: 'Tief liegender, ausdauernder Kopf über dem distalen Oberarm bis zum Olecranon. Er ist bei jeder Ellbogenstreckung unabhängig vom Winkel dauerhaft aktiv und schützt die hintere Gelenkkapsel.',
      en: 'Deep, fatigue-resistant triceps head covering the distal posterior humerus above the elbow. It remains active across all elbow extension angles and resistance levels.'
    },
    view: 'back',
    segment: 'upper_arm',
    artworkRef: 'm_triceps_caput_mediale',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_anconeus',
    type: 'muscle',
    names: {
      la: 'M. anconeus',
      de: 'Knorrenmuskel',
      en: 'Anconeus'
    },
    descriptions: {
      de: 'Kleiner dreieckiger Muskel an der Außenseite des Ellenbogens zwischen lateralem Oberarmknorren und Elle. Er unterstützt die Endstreckung des Ellenbogens und spannt die Gelenkkapsel gegen Einklemmen.',
      en: 'Small triangular muscle at the posterolateral elbow bridging the lateral humeral epicondyle and proximal ulna. It assists terminal elbow extension and stabilizes the joint capsule.'
    },
    view: 'back',
    segment: 'upper_arm',
    artworkRef: 'm_anconeus',
    sidedness: 'bilateral',
    layerOrder: 2
  },

  // 5. Forearm & Hand (17)
  {
    id: 'm_brachioradialis',
    type: 'muscle',
    names: {
      la: 'M. brachioradialis',
      de: 'Oberarmspeichenmuskel',
      en: 'Brachioradialis'
    },
    descriptions: {
      de: 'Markanter daumenseitiger Unterarmmuskel vom unteren äußeren Oberarm bis zum Griffelfortsatz der Speiche. Er beugt den Ellbogen besonders kraftvoll in Neutralstellung (Hammercurls) und balanciert Ein- und Auswärtsdrehung.',
      en: 'Prominent radial forearm muscle running from the lateral supracondylar ridge of the humerus to the distal radius. It flexes the elbow most effectively in a neutral thumb-up grip such as hammer curls.'
    },
    view: 'both',
    segment: 'forearm',
    artworkRef: 'm_brachioradialis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_pronator_teres',
    type: 'muscle',
    names: {
      la: 'M. pronator teres',
      de: 'Runder Einwärtsdreher',
      en: 'Pronator teres'
    },
    descriptions: {
      de: 'Zieht schräg vom inneren Oberarmknorren über die Ellenbeuge zur Mitte der Speiche. Er dreht den Unterarm nach innen (Pronation), hilft bei der Ellbogenbeugung und ist ein häufiger Druckpunkt bei Golferellenbogen.',
      en: 'Passes obliquely from the medial epicondyle across the proximal forearm to the mid-radius. It pronates the forearm and assists elbow flexion, often becoming tender in medial epicondylalgia.'
    },
    view: 'front',
    segment: 'forearm',
    artworkRef: 'm_pronator_teres',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_flexor_carpi_radialis',
    type: 'muscle',
    names: {
      la: 'M. flexor carpi radialis',
      de: 'Speichenseitiger Handbeuger',
      en: 'Flexor carpi radialis'
    },
    descriptions: {
      de: 'Oberflächlicher Beugemuskel an der Vorderseite des Unterarms vom inneren Oberarmknorren zur daumenseitigen Mittelhandbasis. Er beugt das Handgelenk und neigt es Richtung Daumen.',
      en: 'Superficial anterior forearm flexor running from the medial epicondyle to the base of the second and third metacarpals. It flexes and radially deviates the wrist during gripping.'
    },
    view: 'front',
    segment: 'forearm',
    artworkRef: 'm_flexor_carpi_radialis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_palmaris_longus',
    type: 'muscle',
    names: {
      la: 'M. palmaris longus',
      de: 'Langer Hohlhandmuskel',
      en: 'Palmaris longus'
    },
    descriptions: {
      de: 'Schlanker Muskel mit langer, mittig am Handgelenk sichtbarer Sehne, die in die Hohlhandfaszie einstrahlt. Er unterstützt die Handgelenksbeugung und spannt die Palmaraponeurose beim festen Greifen.',
      en: 'Slender superficial flexor whose prominent central wrist tendon fans into the palmar aponeurosis. It weakly assists wrist flexion and tightens the palmar fascia for grip security.'
    },
    view: 'front',
    segment: 'forearm',
    artworkRef: 'm_palmaris_longus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_flexor_carpi_ulnaris',
    type: 'muscle',
    names: {
      la: 'M. flexor carpi ulnaris',
      de: 'Ellenseitiger Handbeuger',
      en: 'Flexor carpi ulnaris'
    },
    descriptions: {
      de: 'Kräftiger innerer Unterarmmuskel entlang der Elle bis zum Erbsenbein der Handwurzel. Er beugt das Handgelenk, neigt es Richtung Kleinfinger und stabilisiert das Handgelenk bei Zug- und Schlagbewegungen.',
      en: 'Medial-most wrist flexor running along the ulna to the pisiform and fifth metacarpal. It flexes and ulnarly deviates the wrist, stabilizing the hand during heavy pulling.'
    },
    view: 'front',
    segment: 'forearm',
    artworkRef: 'm_flexor_carpi_ulnaris',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_flexor_digitorum_superficialis',
    type: 'muscle',
    names: {
      la: 'M. flexor digitorum superficialis',
      de: 'Oberflächlicher Fingerbeuger',
      en: 'Flexor digitorum superficialis'
    },
    descriptions: {
      de: 'Großer Muskelbauch in der mittleren Beugerschicht des Unterarms, der mit vier Sehnen zu den Mittelgliedern der Finger zieht. Er liefert einen Hauptteil der Griffkraft beim Klettern, Kreuzheben und Halten.',
      en: 'Large forearm flexor positioned between the superficial and deep layers with tendons reaching the middle phalanges of digits 2–5. It is essential for sustained grip strength in deadlifts and climbing.'
    },
    view: 'front',
    segment: 'forearm',
    artworkRef: 'm_flexor_digitorum_superficialis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_extensor_carpi_radialis_longus',
    type: 'muscle',
    names: {
      la: 'M. extensor carpi radialis longus',
      de: 'Langer speichenseitiger Handstrecker',
      en: 'Extensor carpi radialis longus'
    },
    descriptions: {
      de: 'Verläuft direkt neben dem Brachioradialis an der Streckseite des Unterarms bis zum zweiten Mittelhandknochen. Er streckt das Handgelenk und stabilisiert es bei kräftigem Faustschluss.',
      en: 'Runs along the lateral forearm posterior to the brachioradialis to the base of the second metacarpal. It extends and radially abducts the wrist, countering wrist flexion during gripping.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_carpi_radialis_longus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_extensor_carpi_radialis_brevis',
    type: 'muscle',
    names: {
      la: 'M. extensor carpi radialis brevis',
      de: 'Kurzer speichenseitiger Handstrecker',
      en: 'Extensor carpi radialis brevis'
    },
    descriptions: {
      de: 'Zieht vom äußeren Oberarmknorren zum dritten Mittelhandknochen und zentriert das Handgelenk in Streckung. Seine Ursprungssehne ist die klassische Hauptstruktur beim Tennisellenbogen (Epicondylitis lateralis).',
      en: 'Extends from the lateral epicondyle to the third metacarpal base to stabilize the wrist in extension. Its proximal tendon is the primary structure irritated in lateral epicondylalgia (tennis elbow).'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_carpi_radialis_brevis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_extensor_digitorum',
    type: 'muscle',
    names: {
      la: 'M. extensor digitorum',
      de: 'Fingerstrecker',
      en: 'Extensor digitorum'
    },
    descriptions: {
      de: 'Zentraler Muskel der Unterarmrückseite, dessen vier Sehnen über den Handrücken zu den Fingern 2–5 laufen. Er öffnet die Hand gegen Widerstand und balanciert überlastete Fingerbeuger aus.',
      en: 'Central dorsal forearm muscle splitting into four tendons across the back of the hand to fingers 2–5. It extends the fingers and wrist and balances high-volume gripping work.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_digitorum',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_extensor_digiti_minimi',
    type: 'muscle',
    names: {
      la: 'M. extensor digiti minimi',
      de: 'Kleinfingerstrecker',
      en: 'Extensor digiti minimi'
    },
    descriptions: {
      de: 'Schmaler Streckmuskel neben dem Fingerstrecker, der eigenständig den kleinen Finger streckt. Er unterstützt zudem die Streckung und leichte Ulnarabduktion des Handgelenks.',
      en: 'Slender dorsal forearm muscle medial to the extensor digitorum inserting into the fifth finger extensor hood. It provides independent extension of the little finger and assists wrist extension.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_digiti_minimi',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_extensor_carpi_ulnaris',
    type: 'muscle',
    names: {
      la: 'M. extensor carpi ulnaris',
      de: 'Ellenseitiger Handstrecker',
      en: 'Extensor carpi ulnaris'
    },
    descriptions: {
      de: 'Verläuft entlang der hinteren Ellenkante bis zur Basis des fünften Mittelhandknochens. Er streckt das Handgelenk, neigt es zur Kleinfingerseite und stabilisiert die Elle am Handgelenk.',
      en: 'Runs along the posterior ulna to the base of the fifth metacarpal. It extends and ulnarly deviates the wrist while stabilizing the distal radioulnar joint during rotational loads.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_carpi_ulnaris',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_supinator',
    type: 'muscle',
    names: {
      la: 'M. supinator',
      de: 'Auswärtsdreher',
      en: 'Supinator'
    },
    descriptions: {
      de: 'Tiefer, um das obere Speichenköpfchen gewickelter Muskel unterhalb der Streckmuskeln. Er dreht den Unterarm in jeder Ellbogenstellung mit der Handfläche nach oben (Supination).',
      en: 'Deep muscle wrapping around the proximal third of the radius beneath the superficial extensors. It supinates the forearm independently of elbow angle.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_supinator',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_abductor_pollicis_longus',
    type: 'muscle',
    names: {
      la: 'M. abductor pollicis longus',
      de: 'Langer Daumenabspreizer',
      en: 'Abductor pollicis longus'
    },
    descriptions: {
      de: 'Tiefer Unterarmmuskel, der schräg über die distale Speiche zur Basis des ersten Mittelhandknochens zieht. Er spreizt den Daumen ab und bildet die vordere Grenze der anatomischen Tabatiere.',
      en: 'Deep dorsal forearm muscle crossing obliquely over the radial wrist to the first metacarpal base. It abducts and extends the thumb at the carpometacarpal joint.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_abductor_pollicis_longus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_extensor_pollicis_longus',
    type: 'muscle',
    names: {
      la: 'M. extensor pollicis longus & brevis',
      de: 'Daumenstrecker',
      en: 'Extensor pollicis'
    },
    descriptions: {
      de: 'Tiefe Streckmuskeln des Daumens vom Unterarm bis zum Daumenend- und -grundglied. Sie heben den Daumen nach hinten und sind bei übermäßiger Smartphone- oder Schlägerbelastung oft gereizt.',
      en: 'Deep forearm muscles whose tendons extend to the proximal and distal phalanges of the thumb. They extend the thumb joints and frequently experience tendon sheath irritation from repetitive thumb use.'
    },
    view: 'back',
    segment: 'forearm',
    artworkRef: 'm_extensor_pollicis_longus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_thenar',
    type: 'muscle',
    names: {
      la: 'Musculi thenaris',
      de: 'Daumenballenmuskulatur',
      en: 'Thenar eminence'
    },
    descriptions: {
      de: 'Kräftige Muskelgruppe am Daumenballen aus kurzem Daumenabspreizer, Daumenbeuger und Daumenopponens. Sie ermöglicht die Gegenüberstellung des Daumens (Oppositionsgriff) für präzises und festes Greifen.',
      en: 'Fleshy muscle group at the base of the thumb comprising the abductor, flexor, and opponens pollicis. It powers thumb opposition and pinch strength.'
    },
    view: 'front',
    segment: 'hand',
    artworkRef: 'm_thenar',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_hypothenar',
    type: 'muscle',
    names: {
      la: 'Musculi hypothenaris',
      de: 'Kleinfingerballenmuskulatur',
      en: 'Hypothenar eminence'
    },
    descriptions: {
      de: 'Muskelpolster an der Kleinfingerseite der Hohlhand (Abduktor, Flexor und Opponens digiti minimi). Es formt die Hohlhand zum kraftvollen Umfassen von Hanteln und schützt den Ulnarnerv.',
      en: 'Muscular pad along the ulnar border of the palm controlling the little finger. It cups the palm to improve barbell and kettlebell grip security.'
    },
    view: 'front',
    segment: 'hand',
    artworkRef: 'm_hypothenar',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_interossei_dorsales_manus',
    type: 'muscle',
    names: {
      la: 'Mm. interossei dorsales manus',
      de: 'Zwischenknochenmuskeln der Hand',
      en: 'Dorsal interossei of hand'
    },
    descriptions: {
      de: 'Vier zweiköpfige kleine Muskeln in den Räumen zwischen den Mittelhandknochen, sichtbar auf dem Handrücken. Sie spreizen die Finger auseinander und stabilisieren die Fingergrundgelenke bei Stützübungen.',
      en: 'Four bipennate intrinsic muscles situated between the metacarpal shafts on the dorsum of the hand. They abduct the fingers and stabilize the knuckles during handstands and push-ups.'
    },
    view: 'back',
    segment: 'hand',
    artworkRef: 'm_interossei_dorsales_manus',
    sidedness: 'bilateral',
    layerOrder: 3
  },

  // 6. Pelvis & Hip (8)
  {
    id: 'm_gluteus_maximus',
    type: 'muscle',
    names: {
      la: 'M. gluteus maximus',
      de: 'Großer Gesäßmuskel',
      en: 'Gluteus maximus'
    },
    descriptions: {
      de: 'Voluminösester Muskel des menschlichen Körpers vom Kreuzbein und hinteren Beckenkamm zum Oberschenkel und IT-Band. Er ist der Hauptstrecker und Außenrotator der Hüfte beim Sprinten, Aufstehen, Hip Thrusts und Kreuzheben.',
      en: 'Largest and heaviest muscle in the body running from the posterior ilium and sacrum to the gluteal tuberosity and IT band. It is the primary hip extensor and external rotator powering squats, sprints, and hip thrusts.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_gluteus_maximus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_gluteus_medius',
    type: 'muscle',
    names: {
      la: 'M. gluteus medius',
      de: 'Mittlerer Gesäßmuskel',
      en: 'Gluteus medius'
    },
    descriptions: {
      de: 'Fächerförmiger Muskel an der seitlichen Hüftaußenseite vom Darmbein bis zum großen Rollhügel. Er spreizt das Bein ab und hält das Becken im Einbeinstand sowie beim Laufen waagerecht (verhindert Beckenabkippen).',
      en: 'Fan-shaped lateral hip abductor spanning from the outer ilium to the greater trochanter. It prevents contralateral pelvic drop during single-leg stance, running, and lunges.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_gluteus_medius',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_gluteus_minimus',
    type: 'muscle',
    names: {
      la: 'M. gluteus minimus',
      de: 'Kleiner Gesäßmuskel',
      en: 'Gluteus minimus'
    },
    descriptions: {
      de: 'Liegt tief direkt unter dem mittleren Gesäßmuskel an der äußeren Beckenschaufel bis zur Vorderseite des Trochanter major. Er unterstützt Abduktion und Innenrotation der Hüfte und zentriert den Hüftkopf in der Pfanne.',
      en: 'Deepest gluteal abductor lying beneath the gluteus medius from the lower ilium to the anterior greater trochanter. It stabilizes the femoral head and assists hip abduction and internal rotation.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_gluteus_minimus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_tensor_fasciae_latae',
    type: 'muscle',
    names: {
      la: 'M. tensor fasciae latae',
      de: 'Schenkelbindenspanner',
      en: 'Tensor fasciae latae (TFL)'
    },
    descriptions: {
      de: 'Kurzer Muskel an der vorderen seitlichen Hüfte vom vorderen oberen Darmbeinstachel (SIAS) ins Iliotibialband. Er unterstützt Hüftbeugung, Abduktion und Innenrotation und spannt den Tractus iliotibialis bei Belastung.',
      en: 'Compact anterolateral hip muscle running from the anterior superior iliac spine into the iliotibial tract. It assists hip flexion, abduction, and internal rotation while tensioning the lateral thigh fascia.'
    },
    view: 'front',
    segment: 'pelvis',
    artworkRef: 'm_tensor_fasciae_latae',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_iliopsoas',
    type: 'muscle',
    names: {
      la: 'M. iliopsoas (M. psoas major & M. iliacus)',
      de: 'Hüftbeuger (Lenden-Darmbeinmuskel)',
      en: 'Iliopsoas'
    },
    descriptions: {
      de: 'Zweiteiliger tiefer Kern- und Hüftmuskel von der Lendenwirbelsäule und inneren Darmbeinschaufel bis zum kleinen Rollhügel des Oberschenkels. Als stärkster Hüftbeuger hebt er das Bein nach vorn und beeinflusst Lendenlordose und Beckenkippung maßgeblich.',
      en: 'Deep primary hip flexor combining the psoas major from the lumbar spine and the iliacus from the iliac fossa, inserting on the lesser trochanter. It drives hip flexion and strongly influences lumbar posture.'
    },
    view: 'front',
    segment: 'pelvis',
    artworkRef: 'm_iliopsoas',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_piriformis',
    type: 'muscle',
    names: {
      la: 'M. piriformis',
      de: 'Birnenförmiger Muskel',
      en: 'Piriformis'
    },
    descriptions: {
      de: 'Tiefer Hüftmuskel von der Vorderfläche des Kreuzbeins durch das große Sitzbeinloch zum oberen Trochanter major. Er dreht die gestreckte Hüfte nach außen; da der Ischiasnerv direkt unter ihm verläuft, führt Verspannung oft zu Gesäßschmerzen.',
      en: 'Deep pelvic muscle extending from the anterior sacrum to the superior greater trochanter. It externally rotates the extended hip and sits directly above the sciatic nerve, making it clinically relevant in deep gluteal pain.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_piriformis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_obturatorius_gemelli',
    type: 'muscle',
    names: {
      la: 'M. obturatorius internus & Mm. gemelli',
      de: 'Tiefe Außenrotatoren der Hüfte',
      en: 'Deep hip external rotators'
    },
    descriptions: {
      de: 'Gruppe kurzer tiefer Rotatoren unterhalb des Piriformis zwischen Sitzbein und kleinem Becken bis zum Trochanter major. Sie wirken als feinfühlige Stabilisatoren (Rotatorenmanschette der Hüfte) bei jeder Drehbewegung.',
      en: 'Trio of deep short hip muscles spanning from the ischium and obturator membrane to the medial greater trochanter. Functioning like a hip rotator cuff, they provide external rotation and posterior joint stability.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_obturatorius_gemelli',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_quadratus_femoris',
    type: 'muscle',
    names: {
      la: 'M. quadratus femoris',
      de: 'Viereckiger Schenkelmuskel',
      en: 'Quadratus femoris'
    },
    descriptions: {
      de: 'Tiefster und kräftigster kurzer Außenrotator zwischen Sitzbeinhöcker und hinterem Rollhügelkamm. Er stabilisiert das Hüftgelenk bei tiefer Beugung wie in der Kniebeuge und verhindert ein Einknicken nach innen.',
      en: 'Flat, rectangular deep hip muscle running horizontally from the ischial tuberosity to the intertrochanteric crest. It powerfully externally rotates the femur and stabilizes the hip during deep squats.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'm_quadratus_femoris',
    sidedness: 'bilateral',
    layerOrder: 1
  },

  // 7. Thigh — Anterior, Medial & Posterior (15)
  {
    id: 'm_sartorius',
    type: 'muscle',
    names: {
      la: 'M. sartorius',
      de: 'Schneidermuskel',
      en: 'Sartorius'
    },
    descriptions: {
      de: 'Längster Muskel des Körpers, der wie ein Band schräg vom vorderen oberen Darmbeinstachel (SIAS) über die Oberschenkelvorderseite zur inneren Schienbeinkante (Pes anserinus) zieht. Er beugt Hüfte und Knie und dreht den Oberschenkel nach außen wie beim Schneidersitz.',
      en: 'Longest muscle in the human body, coursing diagonally from the anterior superior iliac spine across the thigh to the medial proximal tibia (pes anserinus). It simultaneously flexes, abducts, and externally rotates the hip while flexing the knee.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_sartorius',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_rectus_femoris',
    type: 'muscle',
    names: {
      la: 'M. rectus femoris',
      de: 'Gerader Oberschenkelmuskel',
      en: 'Rectus femoris'
    },
    descriptions: {
      de: 'Einziger zweigelenkiger Anteil des Quadrizeps mittig vorn am Oberschenkel vom unteren vorderen Darmbeinstachel bis zur Kniescheibensehne. Er streckt das Kniegelenk und beugt gleichzeitig die Hüfte.',
      en: 'Central, biarticular head of the quadriceps originating from the anterior inferior iliac spine and inserting via the patellar tendon. It extends the knee and flexes the hip during kicking and sprinting.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_rectus_femoris',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_vastus_lateralis',
    type: 'muscle',
    names: {
      la: 'M. vastus lateralis',
      de: 'Äußerer Schenkelmuskel',
      en: 'Vastus lateralis'
    },
    descriptions: {
      de: 'Kräftigster Anteil des Quadrizeps entlang der gesamten Außenseite des Oberschenkels bis zum äußeren Kniescheibenrand. Er erzeugt enorme Streckkraft im Knie bei Kniebeugen, Sprüngen und beim Treppensteigen.',
      en: 'Largest of the four quadriceps muscles covering the lateral thigh from the greater trochanter and linea aspera to the patella. It delivers primary knee extension torque in squats, jumps, and cycling.'
    },
    view: 'both',
    segment: 'thigh',
    artworkRef: 'm_vastus_lateralis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_vastus_medialis',
    type: 'muscle',
    names: {
      la: 'M. vastus medialis (VMO)',
      de: 'Innerer Schenkelmuskel',
      en: 'Vastus medialis'
    },
    descriptions: {
      de: 'Tropfenförmiger innerer Kopf des Quadrizeps direkt oberhalb und medial der Kniescheibe. Seine schrägen unteren Fasern (VMO) führen die Kniescheibe spurtreu nach innen und sichern die letzten Grad der Kniestreckung.',
      en: 'Teardrop-shaped medial quadriceps head adjacent to the patella. Its oblique distal fibers (VMO) track the patella medially and stabilize the knee during terminal extension.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_vastus_medialis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_vastus_intermedius',
    type: 'muscle',
    names: {
      la: 'M. vastus intermedius',
      de: 'Mittlerer Schenkelmuskel',
      en: 'Vastus intermedius'
    },
    descriptions: {
      de: 'Liegt tief unter dem M. rectus femoris direkt auf der Vorderseite des Oberschenkelknochens. Als reiner eingelenkiger Kniestrecker arbeitet er unermüdlich bei jeder Streckbelastung mit.',
      en: 'Deepest quadriceps head lying directly against the anterior shaft of the femur beneath the rectus femoris. It acts purely to extend the knee joint with a direct line of pull.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_vastus_intermedius',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_tractus_iliotibialis',
    type: 'muscle',
    names: {
      la: 'Tractus iliotibialis',
      de: 'Iliotibialband (IT-Band)',
      en: 'Iliotibial tract'
    },
    descriptions: {
      de: 'Dicke, sehnige Faszienverstärkung an der Außenseite des Oberschenkels vom Beckenkamm bis zum äußeren Schienbeinkopf. Es verbindet TFL und Gluteus maximus, stabilisiert das Knie im Einbeinstand und ist beim Läuferknie oft gereizt.',
      en: 'Thick lateral fascial band running from the iliac crest to Gerdy tubercle on the lateral tibia. It transmits tension from the TFL and gluteus maximus to stabilize the knee and is often implicated in runner knee.'
    },
    view: 'both',
    segment: 'thigh',
    artworkRef: 'm_tractus_iliotibialis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_pectineus',
    type: 'muscle',
    names: {
      la: 'M. pectineus',
      de: 'Kammmuskel',
      en: 'Pectineus'
    },
    descriptions: {
      de: 'Kurzer, rechteckiger Muskel in der vorderen Leiste vom Schambeinkamm bis unter den kleinen Rollhügel. Er verbindet Hüftbeugung mit Oberschenkeladduktion und stabilisiert die vordere Hüftkapsel.',
      en: 'Short, flat anterior groin muscle running from the superior pubic ramus to the upper posterior femur. It performs both hip adduction and flexion.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_pectineus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_adductor_longus',
    type: 'muscle',
    names: {
      la: 'M. adductor longus',
      de: 'Langer Schenkelanzieher',
      en: 'Adductor longus'
    },
    descriptions: {
      de: 'Oberflächlichster und am leichtesten tastbarer Adduktor in der vorderen-inneren Leiste vom Schambein zur Oberschenkelrückseite. Er zieht das Bein heran und ist beim Richtungswechsel (z. B. Fußball) am häufigsten von Leistenzerrungen betroffen.',
      en: 'Most superficial anterior hip adductor extending from the pubic body to the middle third of the femur. It adducts and assists hip flexion and is the most commonly strained muscle in groin injuries.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_adductor_longus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_adductor_brevis',
    type: 'muscle',
    names: {
      la: 'M. adductor brevis',
      de: 'Kurzer Schenkelanzieher',
      en: 'Adductor brevis'
    },
    descriptions: {
      de: 'Tiefer unter Kammmuskel und langem Adduktor liegender Muskel zwischen unterem Schambeinast und proximaler Linea aspera. Er zieht den Oberschenkel heran und unterstützt Beugung sowie Stabilität der Hüfte.',
      en: 'Deep triangular adductor located behind the pectineus and adductor longus from the inferior pubic ramus to the upper femur. It powerfully adducts and stabilizes the thigh.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_adductor_brevis',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_adductor_magnus',
    type: 'muscle',
    names: {
      la: 'M. adductor magnus',
      de: 'Großer Schenkelanzieher',
      en: 'Adductor magnus'
    },
    descriptions: {
      de: 'Mächtiger, fächerförmiger Muskel an der gesamten inneren Oberschenkelrückseite bis zum inneren Oberschenkelknorren. Neben starker Adduktion wirkt sein hinterer Anteil in tiefer Beugung als mächtiger Hüftstrecker bei Kniebeugen.',
      en: 'Massive fan-shaped medial thigh muscle stretching from the ischiopubic ramus and ischial tuberosity to the femur. It strongly adducts the thigh and its hamstring portion acts as a powerful hip extensor out of the bottom of a squat.'
    },
    view: 'both',
    segment: 'thigh',
    artworkRef: 'm_adductor_magnus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_gracilis',
    type: 'muscle',
    names: {
      la: 'M. gracilis',
      de: 'Schlanker Muskel',
      en: 'Gracilis'
    },
    descriptions: {
      de: 'Schmaler, langer Muskel ganz innen am Oberschenkel vom unteren Schambeinast bis zum Pes anserinus am Schienbein. Als einziger zweigelenkiger Adduktor zieht er das Bein heran und hilft beim Beugen und Innenrotieren des Knies.',
      en: 'Strap-like superficial muscle along the medial-most border of the thigh from the pubis to the medial tibia. As the only biarticular adductor, it adducts the hip and assists knee flexion.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'm_gracilis',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_biceps_femoris_longum',
    type: 'muscle',
    names: {
      la: 'M. biceps femoris (Caput longum)',
      de: 'Langer Kopf des Schenkelbizeps',
      en: 'Biceps femoris (Long head)'
    },
    descriptions: {
      de: 'Äußerer Muskel der hinteren Oberschenkelgruppe (Hamstrings) vom Sitzbeinhöcker bis zum Wadenbeinköpfchen. Er streckt die Hüfte, beugt das Knie und ist beim Hochgeschwindigkeits-Sprint stark verletzungsanfällig.',
      en: 'Lateral hamstring muscle running from the ischial tuberosity to the fibular head. Crossing both hip and knee, it extends the hip, flexes and externally rotates the knee, and is the hamstring head most often strained in sprinting.'
    },
    view: 'back',
    segment: 'thigh',
    artworkRef: 'm_biceps_femoris_longum',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_biceps_femoris_breve',
    type: 'muscle',
    names: {
      la: 'M. biceps femoris (Caput breve)',
      de: 'Kurzer Kopf des Schenkelbizeps',
      en: 'Biceps femoris (Short head)'
    },
    descriptions: {
      de: 'Tiefer liegender, eingelenkiger Kopf direkt vom mittleren Oberschenkelschaft bis zum Wadenbeinköpfchen. Er beugt ausschließlich das Kniegelenk und dreht den Unterschenkel leicht nach außen.',
      en: 'Deep monoarticular hamstring head originating along the posterior femur and joining the long head to insert on the fibular head. It acts solely at the knee to produce flexion and lateral tibial rotation.'
    },
    view: 'back',
    segment: 'thigh',
    artworkRef: 'm_biceps_femoris_breve',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_semitendinosus',
    type: 'muscle',
    names: {
      la: 'M. semitendinosus',
      de: 'Halbsehnenmuskel',
      en: 'Semitendinosus'
    },
    descriptions: {
      de: 'Oberflächlicher innerer Muskel der Hamstrings mit langer runder Endsehne vom Sitzbeinhöcker bis zur inneren Schienbeinkante (Pes anserinus). Er streckt die Hüfte, beugt das Knie und dreht den Unterschenkel leicht nach innen.',
      en: 'Superficial medial hamstring recognizable by its long cord-like distal tendon from the ischial tuberosity to the medial tibia. It extends the hip, flexes the knee, and internally rotates the tibia.'
    },
    view: 'back',
    segment: 'thigh',
    artworkRef: 'm_semitendinosus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_semimembranosus',
    type: 'muscle',
    names: {
      la: 'M. semimembranosus',
      de: 'Plattsehnenmuskel',
      en: 'Semimembranosus'
    },
    descriptions: {
      de: 'Tiefer und breiter innerer Muskel der Hamstrings unterhalb des Semitendinosus vom Sitzbeinhöcker zur Rückseite des inneren Schienbeinkopfes. Er trägt maßgeblich zur Hüftstreckung und Innenstabilität des Kniegelenks bei.',
      en: 'Broad, deep medial hamstring lying beneath the semitendinosus from the ischial tuberosity to the posteromedial tibia. It generates high hip extension force and stabilizes the posteromedial knee.'
    },
    view: 'back',
    segment: 'thigh',
    artworkRef: 'm_semimembranosus',
    sidedness: 'bilateral',
    layerOrder: 2
  },

  // 8. Lower Leg & Foot (12)
  {
    id: 'm_popliteus',
    type: 'muscle',
    names: {
      la: 'M. popliteus',
      de: 'Kniekehlenmuskel',
      en: 'Popliteus'
    },
    descriptions: {
      de: 'Kleiner, dreieckiger Muskel tief in der Kniekehle vom äußeren Oberschenkelknorren schräg abwärts zur hinteren Schienbeinfläche. Er entriegelt das gestreckte Knie zu Beginn der Beugung durch leichte Innenrotation des Schienbeins.',
      en: 'Small diagonal muscle forming the floor of the popliteal fossa from the lateral femoral condyle to the posterior tibia. It unlocks the fully extended knee to initiate flexion and protects the lateral meniscus.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_popliteus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_tibialis_anterior',
    type: 'muscle',
    names: {
      la: 'M. tibialis anterior',
      de: 'Vorderer Schienbeinmuskel',
      en: 'Tibialis anterior'
    },
    descriptions: {
      de: 'Kräftiger Muskel direkt seitlich der vorderen Schienbeinkante bis zum inneren Fußrand. Er zieht die Fußspitze hoch (Dorsalextension), hebt den inneren Fußrand (Supination) und dämpft beim Gehen und Laufen das Aufsetzen des Vorfußes.',
      en: 'Prominent muscle lateral to the anterior tibial shin crest inserting onto the medial cuneiform and first metatarsal. It dorsiflexes and inverts the foot, controlling forefoot descent after heel strike.'
    },
    view: 'front',
    segment: 'lower_leg',
    artworkRef: 'm_tibialis_anterior',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_extensor_digitorum_longus',
    type: 'muscle',
    names: {
      la: 'M. extensor digitorum longus',
      de: 'Langer Zehenstrecker',
      en: 'Extensor digitorum longus'
    },
    descriptions: {
      de: 'Gefiederter Muskel seitlich des vorderen Schienbeinmuskels, dessen vier Sehnen über den Fußrücken zu den Zehen 2–5 ziehen. Er streckt die Kleinzehen und unterstützt das Anheben des Fußes beim Durchschwingen.',
      en: 'Pennate muscle lateral to the tibialis anterior sending four tendons to toes 2–5. It extends the lesser toes and assists ankle dorsiflexion and eversion.'
    },
    view: 'front',
    segment: 'lower_leg',
    artworkRef: 'm_extensor_digitorum_longus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_extensor_hallucis_longus',
    type: 'muscle',
    names: {
      la: 'M. extensor hallucis longus',
      de: 'Langer Großzehenstrecker',
      en: 'Extensor hallucis longus'
    },
    descriptions: {
      de: 'Tiefer vorderer Unterschenkelmuskel zwischen Tibialis anterior und Zehenstrecker bis zum Endglied der Großzehe. Er streckt die Großzehe und sorgt beim Gehen für ausreichende Bodenfreiheit.',
      en: 'Deep anterior compartment muscle nestled between tibialis anterior and extensor digitorum longus, inserting on the distal phalanx of the hallux. It extends the big toe and assists ankle dorsiflexion.'
    },
    view: 'front',
    segment: 'lower_leg',
    artworkRef: 'm_extensor_hallucis_longus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_fibularis_longus',
    type: 'muscle',
    names: {
      la: 'M. fibularis (peroneus) longus',
      de: 'Langer Wadenbeinmuskel',
      en: 'Fibularis longus'
    },
    descriptions: {
      de: 'Oberflächlicher Muskel an der gesamten Außenseite des Unterschenkels, dessen Sehne hinter dem Außenknöchel unter die Fußsohle zieht. Er hebt den äußeren Fußrand (Pronation), verspannt das Quergewölbe und schützt vor Umknicktraumen.',
      en: 'Superficial lateral leg muscle running along the fibula with a long tendon wrapping under the foot to the first metatarsal. It everts the foot, supports the arch, and resists lateral ankle inversion sprains.'
    },
    view: 'both',
    segment: 'lower_leg',
    artworkRef: 'm_fibularis_longus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_fibularis_brevis',
    type: 'muscle',
    names: {
      la: 'M. fibularis (peroneus) brevis',
      de: 'Kurzer Wadenbeinmuskel',
      en: 'Fibularis brevis'
    },
    descriptions: {
      de: 'Liegt unterhalb des langen Wadenbeinmuskels am unteren Wadenbein mit Ansatz am Höcker des fünften Mittelfußknochens. Er reagiert blitzschnell als dynamischer Stabilisator gegen seitliches Umknicken des Sprunggelenks.',
      en: 'Lies deep and distal to the fibularis longus, attaching directly to the base of the fifth metatarsal. It rapidly everts the foot to stabilize the lateral ankle during cutting and landing.'
    },
    view: 'both',
    segment: 'lower_leg',
    artworkRef: 'm_fibularis_brevis',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_gastrocnemius_mediale',
    type: 'muscle',
    names: {
      la: 'M. gastrocnemius (Caput mediale)',
      de: 'Innerer Zwillingswadenmuskel',
      en: 'Medial Gastrocnemius'
    },
    descriptions: {
      de: 'Innerer, meist tiefer reichender Kopf des oberflächlichen Wadenmuskels vom inneren Oberschenkelknorren über die Achillessehne zum Fersenbein. Er beugt den Fuß plantar bei gestrecktem Knie für explosive Sprints und Sprünge.',
      en: 'Medial head of the superficial calf muscle originating above the medial femoral condyle and merging into the Achilles tendon. It generates rapid plantarflexion power with an extended knee and assists knee flexion.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_gastrocnemius_mediale',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_gastrocnemius_laterale',
    type: 'muscle',
    names: {
      la: 'M. gastrocnemius (Caput laterale)',
      de: 'Äußerer Zwillingswadenmuskel',
      en: 'Lateral Gastrocnemius'
    },
    descriptions: {
      de: 'Äußerer Kopf des zweiköpfigen Wadenmuskels vom äußeren Oberschenkelknorren zur Achillessehne. Gemeinsam mit dem inneren Kopf sorgt er für kraftvollen Abdruck beim Laufen und Springen.',
      en: 'Lateral head of the gastrocnemius spanning from the lateral femoral condyle into the Achilles tendon. Together with the medial head it drives explosive push-off in running and jumping.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_gastrocnemius_laterale',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_soleus',
    type: 'muscle',
    names: {
      la: 'M. soleus',
      de: 'Schollenmuskel',
      en: 'Soleus'
    },
    descriptions: {
      de: 'Breiter, eingelenkiger tiefer Wadenmuskel direkt unter dem Gastrocnemius von Schien- und Wadenbein zur Achillessehne. Als ausdauernder Haltemuskel streckt er das Sprunggelenk auch bei gebeugtem Knie und trägt die Hauptlast beim Laufen und Stehen.',
      en: 'Broad, deep monoarticular calf muscle beneath the gastrocnemius originating from the tibia and fibula to the Achilles tendon. Rich in slow-twitch fibers, it dominates standing posture and plantarflexion when the knee is bent.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_soleus',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'm_tibialis_posterior',
    type: 'muscle',
    names: {
      la: 'M. tibialis posterior',
      de: 'Hinterer Schienbeinmuskel',
      en: 'Tibialis posterior'
    },
    descriptions: {
      de: 'Tiefster Muskel der hinteren Unterschenkelmuskulatur zwischen Schien- und Wadenbein mit Sehnenverlauf hinter dem Innenknöchel unter das Fußgewölbe. Er hält das mediale Längsgewölbe aufrecht und verhindert ein Einknicken des Fußes nach innen.',
      en: 'Deepest posterior leg muscle whose tendon courses behind the medial malleolus into the plantar midfoot. It is the primary dynamic supporter of the medial longitudinal foot arch and controls pronation.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_tibialis_posterior',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'm_tendo_calcaneus',
    type: 'muscle',
    names: {
      la: 'Tendo calcaneus',
      de: 'Achillessehne',
      en: 'Achilles tendon'
    },
    descriptions: {
      de: 'Kräftigste Sehne des menschlichen Körpers, die Gastrocnemius und Soleus am Fersenbeinhöcker (Tuber calcanei) verankert. Sie speichert und entlädt wie eine Feder enorme elastische Energie beim Laufen und Springen.',
      en: 'Thickest and strongest tendon in the human body, uniting the gastrocnemius and soleus to insert onto the posterior calcaneus. It acts as an elastic spring storing and releasing energy during running and plyometrics.'
    },
    view: 'back',
    segment: 'lower_leg',
    artworkRef: 'm_tendo_calcaneus',
    sidedness: 'bilateral',
    layerOrder: 3
  },
  {
    id: 'm_aponeurosis_plantaris',
    type: 'muscle',
    names: {
      la: 'Aponeurosis plantaris & M. extensor digitorum brevis',
      de: 'Plantarfaszie & Fußmuskeln',
      en: 'Plantar fascia & Foot intrinsics'
    },
    descriptions: {
      de: 'Straffe Sehnenplatte der Fußsohle vom Fersenbein bis zu den Zehengrundgelenken zusammen mit den kurzen Fußmuskeln. Sie spannt das Fußgewölbe über den Windlass-Mechanismus beim Abrollen und überträgt Bodenreaktionskräfte.',
      en: 'Dense fibrous band along the sole from the calcaneus to the toes paired with intrinsic foot muscles. It stiffens the foot arch during toe-off via the windlass mechanism and absorbs landing shock.'
    },
    view: 'both',
    segment: 'foot',
    artworkRef: 'm_aponeurosis_plantaris',
    sidedness: 'bilateral',
    layerOrder: 3
  },

  // =========================================================================
  // B. BONES & PHYSIO BONY LANDMARKS (32)
  // =========================================================================
  {
    id: 'b_cranium',
    type: 'bone',
    names: {
      la: 'Cranium (Neurocranium)',
      de: 'Hirnschädel',
      en: 'Skull vault'
    },
    descriptions: {
      de: 'Feste knöcherne Kapsel aus Stirn-, Scheitel-, Schläfen- und Hinterhauptsbein zum Schutz des Gehirns. Die Protuberantia occipitalis externa hinten dient als wichtiger Tast- und Ursprungspunkt für Nacken- und Trapezmuskulatur.',
      en: 'Protective bony vault formed by the frontal, parietal, temporal, and occipital bones enclosing the brain. Its external occipital protuberance serves as a key posterior landmark and attachment for neck muscles.'
    },
    view: 'both',
    segment: 'head',
    artworkRef: 'b_cranium',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_maxilla',
    type: 'bone',
    names: {
      la: 'Maxilla',
      de: 'Oberkiefer',
      en: 'Upper jaw'
    },
    descriptions: {
      de: 'Paariger Gesichtsschädelknochen im Mittelgesicht, der den oberen Zahnbogen, den Nasenboden und Teile der Augenhöhle bildet. Er überträgt Kaukräfte nach oben in das Schädelgerüst.',
      en: 'Paired central facial bone forming the upper jaw, hard palate, and inferior orbital rim. It anchors the upper teeth and distributes chewing forces into the cranium.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'b_maxilla',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_mandibula',
    type: 'bone',
    names: {
      la: 'Mandibula',
      de: 'Unterkiefer',
      en: 'Lower jaw'
    },
    descriptions: {
      de: 'Einziger frei beweglicher Schädelknochen, der über das Kiefergelenk am Schläfenbein artikuliert. Hier setzen Masseter und Temporalis an, was ihn zu einem wichtigen Bezugspunkt bei CMD-Untersuchungen macht.',
      en: 'Only freely mobile bone of the skull, articulating bilaterally at the temporomandibular joints. It serves as the insertion site for the masseter and temporalis muscles.'
    },
    view: 'front',
    segment: 'head',
    artworkRef: 'b_mandibula',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_atlas_axis',
    type: 'bone',
    names: {
      la: 'Atlas (C1) & Axis (C2)',
      de: 'Obere Halswirbel (C1–C2)',
      en: 'Upper cervical vertebrae'
    },
    descriptions: {
      de: 'Die beiden obersten Kopfgelenkswirbel direkt unter dem Hinterhaupt: der ringförmige Atlas (C1) und der zahnartige Axis (C2). Sie ermöglichen gemeinsam rund die Hälfte der gesamten Kopfdrehung und das Nicken.',
      en: 'The specialized first two cervical vertebrae beneath the skull: the ring-like atlas (C1) and the dens-bearing axis (C2). Together they enable nodding and roughly half of all cervical rotation.'
    },
    view: 'back',
    segment: 'neck',
    artworkRef: 'b_atlas_axis',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_vertebrae_cervicales',
    type: 'bone',
    names: {
      la: 'Vertebrae cervicales (C3–C7)',
      de: 'Halswirbelsäule (HWS)',
      en: 'Cervical spine'
    },
    descriptions: {
      de: 'Untere fünf Halswirbel in physiologischer Vorwärtskrümmung (Lordose), wobei C7 (Vertebra prominens) hinten deutlich tastbar vorsteht. Sie tragen das Kopfgewicht und bieten maximale Beweglichkeit in allen Ebenen.',
      en: 'Lower five cervical vertebrae forming a gentle anterior curve (lordosis), with C7 palpable as the prominent bony bump at the base of the neck. They support the head while allowing multi-planar motion.'
    },
    view: 'back',
    segment: 'neck',
    artworkRef: 'b_vertebrae_cervicales',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_clavicula',
    type: 'bone',
    names: {
      la: 'Clavicula',
      de: 'Schlüsselbein',
      en: 'Clavicle (Collarbone)'
    },
    descriptions: {
      de: 'S-förmiger Röhrenknochen an der vorderen oberen Brustkorbgrenze zwischen Brustbein und Schulterdach. Als einzige knöcherne Strebe des Arms zum Rumpf hält es das Schultergelenk auf Abstand und überträgt Druckkräfte.',
      en: 'S-shaped strut connecting the sternum medially to the acromion laterally. As the sole bony link between the upper limb and axial skeleton, it positions the shoulder laterally and transmits forces to the trunk.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'b_clavicula',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_sternum',
    type: 'bone',
    names: {
      la: 'Sternum (Manubrium, Corpus, Processus xiphoideus)',
      de: 'Brustbein',
      en: 'Sternum (Breastbone)'
    },
    descriptions: {
      de: 'Flacher Knochen in der vorderen Brustkorbmitte aus Handgriff (Manubrium), Körper (Corpus) und Schwertfortsatz. Es verbindet die oberen Rippenpaare sowie die Schlüsselbeine und dient dem Brustmuskel als zentraler Ursprung.',
      en: 'Flat dagger-shaped midline bone of the anterior chest comprising the manubrium, body, and xiphoid process. It anchors the clavicles and upper costal cartilages while serving as a central attachment for pectoralis major.'
    },
    view: 'front',
    segment: 'torso',
    artworkRef: 'b_sternum',
    sidedness: 'midline',
    layerOrder: 2
  },
  {
    id: 'b_costae_verae',
    type: 'bone',
    names: {
      la: 'Costae verae (I–VII)',
      de: 'Echte Rippen (1–7)',
      en: 'True ribs'
    },
    descriptions: {
      de: 'Die oberen sieben Rippenpaare, die hinten an der Brustwirbelsäule ansetzen und vorn direkt über eigene Rippenknorpel am Brustbein enden. Sie schützen Herz und Lunge und vergrößern beim Atmen das Brustkorbvolumen.',
      en: 'Upper seven pairs of ribs attaching posteriorly to the thoracic vertebrae and directly anteriorly to the sternum via costal cartilages. They form a resilient protective cage that expands during breathing.'
    },
    view: 'both',
    segment: 'torso',
    artworkRef: 'b_costae_verae',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_costae_spuriae',
    type: 'bone',
    names: {
      la: 'Costae spuriae & fluctuantes (VIII–XII)',
      de: 'Falsche & freie Rippen (8–12)',
      en: 'False & floating ribs'
    },
    descriptions: {
      de: 'Die unteren fünf Rippenpaare: Rippe 8–10 bilden den vorderen Rippenbogen über Knorpelverbindungen, während 11–12 vorn frei in der Muskulatur enden. Sie bieten schrägen Bauchmuskeln, Latissimus und Quadratus lumborum beweglichen Halt.',
      en: 'Lower five rib pairs: ribs 8–10 fuse anteriorly into the costal arch while ribs 11–12 remain free-floating posteriorly. They provide mobile attachment points for the obliques, diaphragm, and quadratus lumborum.'
    },
    view: 'both',
    segment: 'torso',
    artworkRef: 'b_costae_spuriae',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_scapula',
    type: 'bone',
    names: {
      la: 'Scapula (Spina scapulae & Acromion)',
      de: 'Schulterblatt & Schulterdach',
      en: 'Scapula & Acromion'
    },
    descriptions: {
      de: 'Flacher dreieckiger Knochen auf dem hinteren Brustkorb mit der gut tastbaren Schultergräte (Spina scapulae) und dem Schulterdach (Acromion). Es gleitet muskelgeführt in sechs Freiheitsgraden und bildet die Gelenkpfanne für den Oberarm.',
      en: 'Flat triangular bone resting on the posterior rib cage featuring the palpable scapular spine and lateral acromion. It glides dynamically across the thorax to position the glenoid socket for full arm reach.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'b_scapula',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_vertebrae_thoracicae',
    type: 'bone',
    names: {
      la: 'Vertebrae thoracicae (T1–T12)',
      de: 'Brustwirbelsäule (BWS)',
      en: 'Thoracic spine'
    },
    descriptions: {
      de: 'Zwölf Brustwirbel in sanfter Rückwärtskrümmung (Kyphose), die über Gelenkflächen mit allen zwölf Rippenpaaren verbunden sind. Die Brustwirbelsäule ist das Hauptzentrum der Rumpfrotation und entscheidend für schmerzfreie Überkopfmobilität.',
      en: 'Twelve thoracic vertebrae forming a gentle kyphotic curve and articulating with all twelve rib pairs. Thoracic extension and rotation mobility directly govern overhead shoulder mechanics.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'b_vertebrae_thoracicae',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_vertebrae_lumbales',
    type: 'bone',
    names: {
      la: 'Vertebrae lumbales (L1–L5)',
      de: 'Lendenwirbelsäule (LWS)',
      en: 'Lumbar spine'
    },
    descriptions: {
      de: 'Fünf große, massive Lendenwirbel in physiologischer Lordose oberhalb des Kreuzbeins. Ihre starken Wirbelkörper tragen den Großteil des Oberkörpergewichts und sind auf Beugung, Streckung und hohe axiale Lastübertragung ausgelegt.',
      en: 'Five large, weight-bearing lumbar vertebrae curving into a natural lordosis above the sacrum. Built for sagittal flexion-extension and high compressive loads during squats and deadlifts.'
    },
    view: 'back',
    segment: 'torso',
    artworkRef: 'b_vertebrae_lumbales',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_humerus',
    type: 'bone',
    names: {
      la: 'Humerus',
      de: 'Oberarmknochen',
      en: 'Humerus'
    },
    descriptions: {
      de: 'Langer Röhrenknochen des Oberarms vom kugeligen Oberarmkopf in der Schulterpfanne bis zur Gelenkrolle am Ellbogen. Seine beiden Höcker (Tuberculum majus/minus) und die Deltarauigkeit sind zentrale Ansatzpunkte der Schultermuskulatur.',
      en: 'Long bone of the upper arm extending from the spherical humeral head at the shoulder to the distal condyles at the elbow. It provides leverage for all shoulder and elbow prime movers.'
    },
    view: 'both',
    segment: 'upper_arm',
    artworkRef: 'b_humerus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_epicondylus_humeri',
    type: 'bone',
    names: {
      la: 'Epicondylus medialis & lateralis humeri',
      de: 'Ellenbogenknorren',
      en: 'Humeral epicondyles'
    },
    descriptions: {
      de: 'Die beiden gut tastbaren Knochenvorsprünge innen und außen direkt über dem Ellbogengelenk. Am inneren Knorren entspringen die Unterarmbeuger (Golferellenbogen), am äußeren die Strecker (Tennisellenbogen).',
      en: 'Palpable medial and lateral bony prominences at the distal end of the humerus. The medial epicondyle anchors the wrist flexors (golfer elbow site), while the lateral epicondyle anchors the wrist extensors (tennis elbow site).'
    },
    view: 'both',
    segment: 'upper_arm',
    artworkRef: 'b_epicondylus_humeri',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_radius',
    type: 'bone',
    names: {
      la: 'Radius',
      de: 'Speiche',
      en: 'Radius'
    },
    descriptions: {
      de: 'Daumenseitiger Unterarmknochen, der am Handgelenk die Hauptfläche für die Handwurzelknochen bildet. Bei Ein- und Auswärtsdrehung (Pronation/Supination) schwenkt die Speiche geschmeidig um die Elle herum.',
      en: 'Lateral (thumb-side) forearm bone that broadens distally to form the primary wrist joint surface. During pronation and supination, the radius rotates smoothly around the ulna.'
    },
    view: 'both',
    segment: 'forearm',
    artworkRef: 'b_radius',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_ulna',
    type: 'bone',
    names: {
      la: 'Ulna (incl. Olecranon)',
      de: 'Elle & Ellenbogenhöcker',
      en: 'Ulna & Olecranon'
    },
    descriptions: {
      de: 'Kleinfingerseitiger Unterarmknochen, dessen oberes Ende als markanter Ellenbogenhöcker (Olecranon) tastbar ist und Ansatz des Trizeps bildet. Sie bildet die stabile Scharnierachse des Ellbogengelenks.',
      en: 'Medial (pinky-side) forearm bone featuring the prominent proximal olecranon process where the triceps inserts. It provides the primary hinge articulation of the elbow joint.'
    },
    view: 'both',
    segment: 'forearm',
    artworkRef: 'b_ulna',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_ossa_carpi',
    type: 'bone',
    names: {
      la: 'Ossa carpi',
      de: 'Handwurzelknochen',
      en: 'Carpal bones (Wrist)'
    },
    descriptions: {
      de: 'Acht kompakte Knöchelchen in zwei Reihen, die das flexible Handgelenk zwischen Unterarm und Mittelhand bilden. Sie verteilen Stützkräfte beim Handstand, Liegestütz und Gewichtheben auf das gesamte Handgewölbe.',
      en: 'Eight small bones arranged in two rows forming the wrist joint between the forearm and metacarpals. They distribute compressive loads during push-ups, cleans, and handstands.'
    },
    view: 'both',
    segment: 'hand',
    artworkRef: 'b_ossa_carpi',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_ossa_metacarpi',
    type: 'bone',
    names: {
      la: 'Ossa metacarpi (I–V)',
      de: 'Mittelhandknochen',
      en: 'Metacarpals'
    },
    descriptions: {
      de: 'Fünf schlanke Röhrenknochen der Hohlhand und des Handrückens, deren Köpfchen die sichtbaren Fingerknöchel bilden. Sie formen das Quergewölbe der Hand und übertragen Griff- und Schlagkräfte.',
      en: 'Five tubular bones forming the structural palm of the hand, with their distal heads visible as the knuckles. They create the hand arch required for gripping and impact absorption.'
    },
    view: 'both',
    segment: 'hand',
    artworkRef: 'b_ossa_metacarpi',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_phalanges_manus',
    type: 'bone',
    names: {
      la: 'Phalanges manus',
      de: 'Fingerknochen',
      en: 'Phalanges of the hand'
    },
    descriptions: {
      de: 'Die vierzehn kurzen Röhrenknochen der Finger (je drei an Langfingern, zwei am Daumen). Sie bilden über Scharniergelenke eine fein steuerbare Kette für Zug-, Halte- und Greifaufgaben.',
      en: 'Fourteen digital bones comprising the fingers (three per finger and two in the thumb). Articulated by hinge joints, they enable fine dexterity and hook-grip wrapping around bars.'
    },
    view: 'both',
    segment: 'hand',
    artworkRef: 'b_phalanges_manus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_os_ilium',
    type: 'bone',
    names: {
      la: 'Os ilium (Crista iliaca, SIAS/SIPS)',
      de: 'Darmbein & Beckenkamm',
      en: 'Ilium & Iliac crest'
    },
    descriptions: {
      de: 'Größter, schaufelförmiger Teil des Hüftbeins mit dem seitlich gut tastbaren Beckenkamm sowie vorderem und hinterem Darmbeinstachel (SIAS/SIPS). In der Physiotherapie sind diese Punkte Standardmarken zur Beurteilung von Beckenschiefstand und -kippung.',
      en: 'Broad superior wing of the pelvic bone featuring the palpable iliac crest, ASIS, and PSIS. These bony landmarks serve as clinical reference points for assessing pelvic tilt, rotation, and leg-length symmetry.'
    },
    view: 'both',
    segment: 'pelvis',
    artworkRef: 'b_os_ilium',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_os_ischii',
    type: 'bone',
    names: {
      la: 'Os ischii (Tuberositas ischiadica)',
      de: 'Sitzbein & Sitzbeinhöcker',
      en: 'Ischium & Sit bone'
    },
    descriptions: {
      de: 'Unterer hinterer Teil des Beckens mit dem kräftigen Sitzbeinhöcker als Hauptbelastungspunkt im Sitzen. Hier entspringen sämtliche Hamstrings (hintere Oberschenkelmuskulatur) und Teile des Adductor magnus.',
      en: 'Posteroinferior pelvic bone bearing the rugged ischial tuberosity (sit bone). It serves as the proximal origin for all three hamstring muscles and the sacrotuberous ligament.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'b_os_ischii',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_os_pubis',
    type: 'bone',
    names: {
      la: 'Os pubis (Symphysis pubica)',
      de: 'Schambein & Schambeinfuge',
      en: 'Pubis & Pubic symphysis'
    },
    descriptions: {
      de: 'Vorderer unterer Beckenanteil, der beide Hüftbeine vorn über die faserknorpelige Schambeinfuge (Symphyse) zu einem geschlossenen Ring verbindet. Es verankert die geraden Bauchmuskeln und die gesamte Adduktorengruppe.',
      en: 'Anterior inferior pelvic bone meeting its contralateral partner at the fibrocartilaginous pubic symphysis. It anchors the rectus abdominis superiorly and the hip adductors inferiorly.'
    },
    view: 'front',
    segment: 'pelvis',
    artworkRef: 'b_os_pubis',
    sidedness: 'midline',
    layerOrder: 1
  },
  {
    id: 'b_os_sacrum',
    type: 'bone',
    names: {
      la: 'Os sacrum & Os coccygis',
      de: 'Kreuzbein & Steißbein',
      en: 'Sacrum & Coccyx'
    },
    descriptions: {
      de: 'Keilförmiger Knochen aus fünf verschmolzenen Kreuzwirbeln und dem kleinen Steißbein am unteren Ende der Wirbelsäule. Über die Iliosakralgelenke (ISG) leitet es das gesamte Oberkörpergewicht auf den Beckenring und die Beine.',
      en: 'Triangular bone formed by five fused sacral vertebrae and the terminal coccyx forming the posterior keystone of the pelvis. Through the sacroiliac joints it transfers upper-body loads into the lower extremities.'
    },
    view: 'back',
    segment: 'pelvis',
    artworkRef: 'b_os_sacrum',
    sidedness: 'midline',
    layerOrder: 2
  },
  {
    id: 'b_femur',
    type: 'bone',
    names: {
      la: 'Femur (Caput, Collum, Corpus)',
      de: 'Oberschenkelknochen',
      en: 'Femur (Thigh bone)'
    },
    descriptions: {
      de: 'Längster und stärkster Röhrenknochen des Körpers mit gewinkeltem Schenkelhals zwischen Hüftpfanne und Kniegelenk. Er trägt hohe Biege- und Kompressionskräfte und bildet den zentralen Hebelarm für Quadrizeps und Hamstrings.',
      en: 'Longest and strongest bone in the body bridging the hip socket and knee joint via an angled femoral neck. Built to withstand massive compressive and bending forces during locomotion and heavy lifting.'
    },
    view: 'both',
    segment: 'thigh',
    artworkRef: 'b_femur',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_trochanter_major',
    type: 'bone',
    names: {
      la: 'Trochanter major femoris',
      de: 'Großer Rollhügel',
      en: 'Greater trochanter'
    },
    descriptions: {
      de: 'Kräftiger, außen an der Hüfte tastbarer Knochenvorsprung am oberen Ende des Oberschenkelschafts. Er vergrößert als Hebelarm das Drehmoment für Gluteus medius, minimus und die tiefen Hüftrotatoren.',
      en: 'Large lateral bony prominence near the top of the femur easily palpated on the outer hip. It acts as a mechanical lever arm increasing the torque of the gluteus medius and deep hip rotators.'
    },
    view: 'both',
    segment: 'pelvis',
    artworkRef: 'b_trochanter_major',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_patella',
    type: 'bone',
    names: {
      la: 'Patella',
      de: 'Kniescheibe',
      en: 'Patella (Kneecap)'
    },
    descriptions: {
      de: 'Größtes Sesambein des Körpers, eingebettet in die Ansatzsehne des Quadrizeps direkt vor dem Kniegelenk. Sie verlagert den Sehnenzug nach vorn, steigert die Kniestreckkraft um bis zu 30 % und schützt das Gelenk.',
      en: 'Largest sesamoid bone in the body embedded within the quadriceps tendon anterior to the knee. It increases the mechanical moment arm of the quadriceps by up to 30% during knee extension.'
    },
    view: 'front',
    segment: 'thigh',
    artworkRef: 'b_patella',
    sidedness: 'bilateral',
    layerOrder: 2
  },
  {
    id: 'b_tibia',
    type: 'bone',
    names: {
      la: 'Tibia (incl. Tuberositas tibiae & Malleolus medialis)',
      de: 'Schienbein & Innenknöchel',
      en: 'Tibia (Shinbone)'
    },
    descriptions: {
      de: 'Kräftiger innerer Unterschenkelknochen, der vorn die scharfe Schienbeinkante, oben den Ansatzhöcker der Kniescheibensehne und unten den Innenknöchel bildet. Das Schienbein trägt nahezu die gesamte axiale Last zwischen Knie und Sprunggelenk.',
      en: 'Primary weight-bearing bone of the lower leg forming the anterior shin crest, tibial tuberosity for the patellar tendon, and medial malleolus at the ankle. It transmits nearly all axial load from the knee to the talus.'
    },
    view: 'both',
    segment: 'lower_leg',
    artworkRef: 'b_tibia',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_fibula',
    type: 'bone',
    names: {
      la: 'Fibula (incl. Caput fibulae & Malleolus lateralis)',
      de: 'Wadenbein & Außenknöchel',
      en: 'Fibula'
    },
    descriptions: {
      de: 'Schlanker seitlicher Begleitknochen des Unterschenkels vom tastbaren Wadenbeinköpfchen unter dem Knie bis zum tief stehenden Außenknöchel. Es dient vielen Muskeln als Ursprung und bildet die äußere Gabel des oberen Sprunggelenks.',
      en: 'Slender lateral leg bone running from the palpable fibular head below the lateral knee to the lateral malleolus. It anchors the lateral leg muscles and forms the outer mortise stabilizing the ankle.'
    },
    view: 'both',
    segment: 'lower_leg',
    artworkRef: 'b_fibula',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_talus',
    type: 'bone',
    names: {
      la: 'Talus',
      de: 'Sprungbein',
      en: 'Talus'
    },
    descriptions: {
      de: 'Zentraler Fußwurzelknochen ohne eigenen Muskelansatz, eingepasst zwischen Schien-, Waden- und Fersenbein. Er überträgt das gesamte Körpergewicht im oberen und unteren Sprunggelenk auf den Fuß.',
      en: 'Central tarsal bone sitting beneath the tibia and fibula and atop the calcaneus with no direct muscle attachments. It acts as a universal joint distributing body weight into the foot.'
    },
    view: 'both',
    segment: 'foot',
    artworkRef: 'b_talus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_calcaneus',
    type: 'bone',
    names: {
      la: 'Calcaneus',
      de: 'Fersenbein',
      en: 'Calcaneus (Heel bone)'
    },
    descriptions: {
      de: 'Größter und stärkster Fußwurzelknochen, der die Ferse bildet und hinten als kräftiger Hebel für die Achillessehne dient. Er fängt beim Gehen und Landen den ersten Bodenkontakt ab.',
      en: 'Largest tarsal bone forming the heel and projecting posteriorly as the lever arm for the Achilles tendon. It absorbs initial ground reaction forces at heel strike.'
    },
    view: 'back',
    segment: 'foot',
    artworkRef: 'b_calcaneus',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_ossa_tarsi_metatarsi',
    type: 'bone',
    names: {
      la: 'Ossa tarsi & Ossa metatarsi (I–V)',
      de: 'Fußwurzel- & Mittelfußknochen',
      en: 'Tarsals & Metatarsals'
    },
    descriptions: {
      de: 'Kahnbein, Würfelbein, drei Keilbeine und die fünf Mittelfußknochen bilden zusammen das Längs- und Quergewölbe des Fußes. Sie kombinieren federnde Stoßdämpfung mit einem stabilen Hebel beim Abdruck.',
      en: 'The midfoot tarsals (navicular, cuboid, cuneiforms) and five metatarsals form the longitudinal and transverse foot arches. They transition smoothly from shock absorption to rigid leverage at push-off.'
    },
    view: 'both',
    segment: 'foot',
    artworkRef: 'b_ossa_tarsi_metatarsi',
    sidedness: 'bilateral',
    layerOrder: 1
  },
  {
    id: 'b_phalanges_pedis',
    type: 'bone',
    names: {
      la: 'Phalanges pedis',
      de: 'Zehenknochen',
      en: 'Phalanges of the foot'
    },
    descriptions: {
      de: 'Vierzehn kurze Röhrenknochen der fünf Zehen, besonders kräftig am Großzehenstrahl für den finalen Bodenabdruck. Sie verbessern Gleichgewicht, Propriozeption und Kraftübertragung beim Laufen und Springen.',
      en: 'Fourteen digital bones of the toes, led by the robust hallux for terminal push-off power. They expand the base of support and enhance balance during standing and sprinting.'
    },
    view: 'both',
    segment: 'foot',
    artworkRef: 'b_phalanges_pedis',
    sidedness: 'bilateral',
    layerOrder: 1
  }
];

export const ANATOMY_BY_ID: ReadonlyMap<string, AnatomyStructure> = new Map(
  ANATOMY_STRUCTURES.map((item) => [item.id, item])
);
