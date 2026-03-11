/**
 * SOM AI model configuration.
 * Define your own model tiers here; backend maps these ids to the actual provider models.
 */

export interface SomModel {
  id: string;
  name: string;
  description: string;
}

/** SOM AI models shown in the picker. Add or edit to match your product. */
export const SOM_MODELS: SomModel[] = [
  { id: "advisor", name: "SOM Advisor", description: "Strategy and hard decisions" },
  { id: "standard", name: "SOM Standard", description: "Everyday mentor advice" },
  { id: "quick", name: "SOM Quick", description: "Clear answers, fast" },
];

/** Default model id when none is selected. */
export const SOM_DEFAULT_MODEL_ID = "standard";
