import { ChatBedrockConverse } from '@langchain/aws';
import {
	NodeConnectionType,
	type INodeType,
	type INodeTypeDescription,
	type ISupplyDataFunctions,
	type SupplyData,
} from 'n8n-workflow';

import { getProxyAgent } from '../../utils/httpProxyAgent';
import { getConnectionHintNoticeField } from '../../utils/sharedFields';

import { makeN8nLlmFailedAttemptHandler } from '../n8nLlmFailedAttemptHandler';
import { N8nLlmTracing } from '../N8nLlmTracing';

export class BedrockChatIAM implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AWS Bedrock Chat Model (IAM)',

		name: 'bedrockChatIAM',
		icon: 'file:bedrock.svg',
		group: ['transform'],
		version: [1, 1.1],
		description: 'Language Model AWS Bedrock using IAM auth (on machine)',
		defaults: {
			name: 'AWS Bedrock Chat Model (IAM)',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatawsbedrock/',
					},
				],
			},
		},

		inputs: [],

		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		/*credentials: [
			{
				name: 'aws',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '=https://bedrock.{{$credentials?.region ?? "us-east-1a"}}.amazonaws.com',
		},*/
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiChain]),
			{
				displayName: "Model ID",
				name: 'modelId',
				type: 'string',
				default: '',
				placeholder: 'anthropic.claude-3-7-sonnet-2025019',
				description: 'Enter or map a model ID from a previous node (supports expressions).',
				requiresDataPath: 'single',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokensToSample',
						default: 2000,
						description: 'The maximum number of tokens to generate in the completion',
						type: 'number',
					},
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 1 },
						default: 0.9,
						description: 'Nucleus sampling (0-1). Leave default for typical behavior.',
					},
					{
						displayName: 'Region',
						name: 'region',
						type: 'string',
						default: 'us-east-1',
						description: 'AWS region for Bedrock',
					}
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		//const credentials = await this.getCredentials('aws');
		const modelName = this.getNodeParameter('modelId', itemIndex) as string;
		const region = this.getNodeParameter('region', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			temperature: number;
			maxTokensToSample: number;
			topP: number;
		};

		const model = new ChatBedrockConverse({
			region: region,
			model: modelName,
			temperature: options.temperature,
			maxTokens: options.maxTokensToSample,
			topP: options.topP,
			clientConfig: {
				httpAgent: getProxyAgent(),
			},
			/*credentials: {
				secretAccessKey: credentials.secretAccessKey as string,
				accessKeyId: credentials.accessKeyId as string,
				sessionToken: credentials.sessionToken as string,
			},*/
			callbacks: [new N8nLlmTracing(this)],
			onFailedAttempt: makeN8nLlmFailedAttemptHandler(this),
		});

		return {
			response: model,
		};
	}
}