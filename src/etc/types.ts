import {Arguments} from 'yargs';


/**
 * Command-line flags we accept.
 */
export interface ShhArguments extends Arguments {
  file?: string;
  stop: boolean;
  timeout: string;
  public: boolean;
}
