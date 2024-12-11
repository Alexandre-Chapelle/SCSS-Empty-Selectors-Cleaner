import inquirer from "inquirer";
import { features, type SelectedFunctionality } from "../types";

export async function getFeatureType(): Promise<SelectedFunctionality> {
  const { searchType } = await inquirer.prompt([
    {
      type: "list",
      name: "searchType",
      message: "Select the feature you want to use:",
      choices: features,
    },
  ]);

  return searchType as SelectedFunctionality;
}
