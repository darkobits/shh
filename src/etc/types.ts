import { Arguments } from 'yargs';


/**
 * Command-line flags we accept.
 */
export interface ShhArguments extends Arguments {
  secret?: string;
  file?: string;
  stop: boolean;
  timeout: string;
  public: boolean;
}
