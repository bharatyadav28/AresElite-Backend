const mongoose = require('mongoose');

const accommodativeFacilityEnum = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

const angleEnum = ['4+', '3+', '2+', '1+', 'Dangerously Narrow Angle', 'Closed'];
const anteriorChamberEnum = [
    'DEEP & QUIET',
    'Acute Angle Closure Nasal',
    'Acute Angle Closure Temporal',
    'Acute Angle Closure Superior',
    'Acute Angle Closure Inferior',
    'Chronic Open Angle Nasal',
    'Chronic Open Angle Temporal',
    'Chronic Open Angle Superior',
    'Chronic Open Angle Inferior',
    'Hyphema',
    'Uveitis',
    'Iridocorneal Endothelial Syndrome (ICE)',
    'Iris Bombe',
    'Pigment Dispersion Syndrome'
];
const caseHistoryEnum = [
    '(+) Blur at distance',
    '(+) Blur at near',
    '(+) Blur at distance and near',
    '(+) Headaches after reading'
];
const cdHOEnum = [
    0.10, 0.15, 0.20, 0.25, 0.30,
    0.35, 0.40, 0.45, 0.50, 0.55,
    0.60, 0.65, 0.70, 0.75, 0.80,
    0.85, 0.90, 0.95, 1.00
];
const cdVOEnum = [
    0.10, 0.15, 0.20, 0.25, 0.30,
    0.35, 0.40, 0.45, 0.50, 0.55,
    0.60, 0.65, 0.70, 0.75, 0.80,
    0.85, 0.90, 0.95, 1.00
];
const confrontationalVisualFieldsEnum = ['FULL OU', 'FULL OD', 'FULL OS'];
const conjunctivaConditionsEnum = [
    'WNL',
    'Allergic Conjunctivitis',
    'Bacterial Conjunctivitis',
    'Viral Conjunctivitis',
    'Nasal Pterygium',
    'Temporal Pterygium',
    'Nasal Pinguecula',
    'Temporal Pinguecula',
    'Nasal Subconjunctival Hemorrhage',
    'Temporal Subconjunctival Hemorrhage',
    'Superior Subconjunctival Hemorrhage',
    'Inferior Subconjunctival Hemorrhage',
    'Nasal Episcleritis',
    'Temporal Episcleritis',
    'Scleritis'
];
const contactLensODAddEnum = ['+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.25'];
const contactLensODAxisEnum = Array.from({ length: 180 }, (_, i) => (i + 1).toString().padStart(3, '0'));
const contactLensODCylEnum = ['-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25'];
const contactLensODSphEnum = [
    '-12.00', '-11.75', '-11.50', '-11.25', '-11.00',
    '-10.75', '-10.50', '-10.25', '-10.00', '-9.75',
    '-9.50', '-9.25', '-9.00', '-8.75', '-8.50',
    '-8.25', '-8.00', '-7.75', '-7.50', '-7.25',
    '-7.00', '-6.75', '-6.50', '-6.25', '-6.00',
    '-5.75', '-5.50', '-5.25', '-5.00', '-4.75',
    '-4.00', '-3.75', '-3.50', '-3.25', '-3.00',
    '-2.75', '-2.50', '-2.25', '-2.00', '-1.75',
    '-1.50', '-1.25', '-1.00', '-0.75', '-0.50',
    '-0.25', '+0.25', '+0.50', '+0.75',
    '+1.00', '+1.25', '+1.50', '+1.75', '+2.00',
    '+2.25', '+2.50', '+2.75', '+3.00', '+3.25',
    '+3.50', '+3.75', '+4.00', '+4.25', '+4.75',
    '+5.00', '+5.25', '+5.50', '+5.75', '+6.00',
    '+6.25', '+6.50', '+6.75', '+7.00', '+7.25',
    '+7.50', '+7.75', '+8.00', '+8.25', '+8.50',
    '+8.75', '+9.00', '+9.25', '+9.50', '+9.75',
    '+10.00', '+10.25', '+10.50', '+10.75', '+11.00',
    '+11.25', '+11.50', '+11.75', '+12.00'
];

const corneaConditionsEnum = [
    'WNL',
    'Bacterial Keratitis',
    'Fungal Keratitis',
    'Acanthamoeba Keratitis',
    'Corneal Ulcer (Central)',
    'Corneal Ulcer (Nasal)',
    'Corneal Ulcer (Temporal)',
    'Corneal Ulcer (Superior)',
    'Corneal Ulcer (Inferior)',
    'Corneal Abrasion (Central)',
    'Corneal Abrasion (Nasal)',
    'Corneal Abrasion (Temporal)',
    'Corneal Abrasion (Superior)',
    'Corneal Abrasion (Inferior)',
    'Dry Eye Syndrome',
    'Corneal Dystrophy',
    'Keratoconus',
    'Corneal Degeneration',
    'Corneal Edema',
    'Corneal Neovascularization',
    'Arcus Senilis',
    'Corneal Foreign Body'
];

const ctdEnum = [
    'Exophoria',
    'Esophoria',
    'Constant Exotropia',
    'Constant Esotropia',
    'Constant Hypertropia',
    'Constant Hypotropia',
    'Intermittent Exotropia',
    'Intermittent Esotropia',
    'Intermittent Hypertropia',
    'Intermittent Hypotropia'
];

const ctdMagnitudeEnum = [
    'Ortho', '2', '4', '6', '8', '10', '12', '14', '16', '18',
    '20', '25', '30', '35', '40', '45'
];

const dryRefractionODAddEnum = [
    '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25',
    '+2.50', '+2.75', '+3.00', '+3.25'
];

const dryRefractionODAxisEnum = Array.from({ length: 180 }, (_, i) => (i + 1).toString().padStart(3, '0'));

const evaluationSchema = new mongoose.Schema({
    accommodativeFacilityOD: {
        type: String,
        enum: accommodativeFacilityEnum,
        required: true
    },
    accommodativeFacilityOS: {
        type: String,
        enum: accommodativeFacilityEnum,
        required: true
    },
    accommodativeFacilityOU: {
        type: String,
        enum: accommodativeFacilityEnum,
        required: true
    },
    angleOD: {
        type: String,
        enum: angleEnum,
        required: true
    },
    angleOS: {
        type: String,
        enum: angleEnum,
        required: true
    },
    anteriorChamberOD: {
        type: String,
        enum: anteriorChamberEnum,
        required: true
    },
    anteriorChamberOS: {
        type: String,
        enum: anteriorChamberEnum,
        required: true
    },
    caseHistoryInformation: {
        type: String,
        enum: caseHistoryEnum,
        required: true
    },
    cdHOD: {
        type: Number,
        enum: cdHOEnum,
        required: true
    },
    cdHOS: {
        type: Number,
        enum: cdHOEnum,
        required: true
    },
    cdVOD: {
        type: Number,
        enum: cdVOEnum,
        required: true

    },
    cdVOS: {
        type: Number,
        enum: cdVOEnum,
        required: true
    },
    colorVisionOD: {
        type: String,
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        required: true
    },
    colorVisionOS: {
        type: String,
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        required: true
    },
    confrontationalVisualFields: {
        type: String,
        enum: confrontationalVisualFieldsEnum,
        required: true
    },
    conjunctivaOD: {
        type: String,
        enum: conjunctivaConditionsEnum,
        required: true
    },
    conjunctivaOS: {
        type: String,
        enum: conjunctivaConditionsEnum,
        required: true
    },
    contactLensODadd: {
        type: String,
        enum: contactLensODAddEnum,
        required: true
    },
    contactLensODaxis: {
        type: String,
        enum: contactLensODAxisEnum,
        required: true
    },
    contactLensODcyl: {
        type: String,
        enum: contactLensODCylEnum,
        required: true
    },
    contactLensODsph: {
        type: String,
        enum: contactLensODSphEnum,
        required: true
    },
    corneaOD: {
        type: String,
        enum: corneaConditionsEnum,
        required: true
    },
    ctd: {
        type: String,
        enum: ctdEnum,
        required: true
    },
    ctdMagnitude: {
        type: String,
        enum: ctdMagnitudeEnum,
        required: true
    },
    dryRefractionODadd: {
        type: String,
        enum: dryRefractionODAddEnum,
        required: true
    },
    dryRefractionODaxis: {
        type: String,
        enum: dryRefractionODAxisEnum,
        required: true
    },
    dryRefractionODcyl: {
        type: String,
        enum: ['-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '-6.25', '-6.50', '-6.75', '-7.00', '-7.25', '-7.50', '-7.75', '-8.00', '-8.25', '-8.50', '-8.75', '-9.00', '-9.25', '-9.50', '-9.75', '-10.00', '-10.25', '-10.50', '-10.75', '-11.00', '-11.25', '-11.50', '-11.75', '-12.00'],
        required: true
    },
    dryRefractionODsph: {
        type: String,
        enum: ['pl', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '-6.25', '-6.50', '-6.75', '-7.00', '-7.25', '-7.50', '-7.75', '-8.00', '-8.25', '-8.50', '-8.75', '-9.00', '-9.25', '-9.50', '-9.75', '-10.00', '-10.25', '-10.50', '-10.75', '-11.00', '-11.25', '-11.50', '-11.75', '-12.00', '+0.25', '+0.50', '+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.25', '+3.50', '+3.75', '+4.00', '+4.25', '+4.75', '+5.00', '+5.25', '+5.50', '+5.75', '+6.00', '+6.25', '+6.50', '+6.75', '+7.00', '+7.25', '+7.50', '+7.75', '+8.00', '+8.25', '+8.50', '+8.75', '+9.00', '+9.25', '+9.50', '+9.75', '+10.00', '+10.25', '+10.50', '+10.75', '+11.00', '+11.25', '+11.50', '+11.75', '+12.00'],
        required: true
    },
    dryRefractionOSadd: {
        type: String,
        enum: ['+0.75', '+1.00', '+1.25', '+1.50', '+1.75', '+2.00', '+2.25', '+2.50', '+2.75', '+3.00', '+3.25'],
        required: true
    },
    dryRefractionOSaxis: {
        type: String,
        enum: Array.from({ length: 180 }, (_, i) => (i + 1).toString().padStart(3, '0')),
        required: true
    },
    dryRefractionOScyl: {
        type: String,
        enum: ['-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '-6.25', '-6.50', '-6.75', '-7.00', '-7.25', '-7.50', '-7.75', '-8.00', '-8.25', '-8.50', '-8.75', '-9.00', '-9.25', '-9.50', '-9.75', '-10.00', '-10.25', '-10.50', '-10.75', '-11.00', '-11.25', '-11.50', '-11.75', '-12.00'],
        required: true
    },
    dryRefractionOSsph: {
        type: String,
        enum: ['-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50', '-2.75', '-3.00', '-3.25', '-3.50', '-3.75', '-4.00', '-4.25', '-4.75', '-5.00', '-5.25', '-5.50', '-5.75', '-6.00', '-6.25', '-6.50', '-6.75', '-7.00', '-7.25', '-7.50', '-7.75', '-8.00', '-8.25', '-8.50', '-8.75', '-9.00', '-9.25', '-9.50', '-9.75', '-10.00', '-10.25', '-10.50', '-10.75', '-11.00', '-11.25', '-11.50', '-11.75', '-12.00'],
        required: true
    }
});
module.exports = mongoose.model("evaluation", evaluationSchema);
