import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Account_Key {
  id: UUIDString;
  __typename?: 'Account_Key';
}

export interface Client_Key {
  id: UUIDString;
  __typename?: 'Client_Key';
}

export interface CreateAccountDataData {
  account_insert: Account_Key;
}

export interface CreateClientDataData {
  client_insert: Client_Key;
}

export interface CreateClientDataVariables {
  accountId: UUIDString;
}

export interface CreateDealDataData {
  deal_insert: Deal_Key;
}

export interface CreateDealDataVariables {
  clientId: UUIDString;
}

export interface CreateInteractionDataData {
  interaction_insert: Interaction_Key;
}

export interface CreateInteractionDataVariables {
  clientId: UUIDString;
}

export interface CreateTaskDataData {
  task_insert: Task_Key;
}

export interface CreateTaskDataVariables {
  clientId: UUIDString;
}

export interface Deal_Key {
  id: UUIDString;
  __typename?: 'Deal_Key';
}

export interface DeleteAccountData {
  account_delete?: Account_Key | null;
}

export interface DeleteAccountVariables {
  id: UUIDString;
}

export interface DeleteClientData {
  client_delete?: Client_Key | null;
}

export interface DeleteClientVariables {
  id: UUIDString;
}

export interface DeleteDealData {
  deal_delete?: Deal_Key | null;
}

export interface DeleteDealVariables {
  id: UUIDString;
}

export interface DeleteInteractionData {
  interaction_delete?: Interaction_Key | null;
}

export interface DeleteInteractionVariables {
  id: UUIDString;
}

export interface DeleteTaskData {
  task_delete?: Task_Key | null;
}

export interface DeleteTaskVariables {
  id: UUIDString;
}

export interface GetAccountData {
  account?: {
    name: string;
    email: string;
    subscriptionTier?: string | null;
  };
}

export interface GetAccountVariables {
  id: UUIDString;
}

export interface GetClientData {
  client?: {
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface GetClientVariables {
  id: UUIDString;
}

export interface GetDealData {
  deal?: {
    title: string;
    stage: string;
    value: number;
    closeDate?: DateString | null;
  };
}

export interface GetDealVariables {
  id: UUIDString;
}

export interface GetInteractionData {
  interaction?: {
    type: string;
    summary: string;
    timestamp?: TimestampString | null;
  };
}

export interface GetInteractionVariables {
  id: UUIDString;
}

export interface GetTaskData {
  task?: {
    title: string;
    dueDate: DateString;
    isCompleted?: boolean | null;
  };
}

export interface GetTaskVariables {
  id: UUIDString;
}

export interface Interaction_Key {
  id: UUIDString;
  __typename?: 'Interaction_Key';
}

export interface ListAccountsData {
  accounts: ({
    name: string;
    email: string;
  })[];
}

export interface ListClientsData {
  clients: ({
    name: string;
    industry?: string | null;
    website?: string | null;
  })[];
}

export interface ListDealsData {
  deals: ({
    title: string;
    stage: string;
    value: number;
  })[];
}

export interface ListInteractionsData {
  interactions: ({
    type: string;
    summary: string;
  })[];
}

export interface ListTasksData {
  tasks: ({
    title: string;
    dueDate: DateString;
  })[];
}

export interface Task_Key {
  id: UUIDString;
  __typename?: 'Task_Key';
}

export interface UpdateAccountData {
  account_update?: Account_Key | null;
}

export interface UpdateAccountVariables {
  id: UUIDString;
  tier?: string | null;
}

export interface UpdateClientData {
  client_update?: Client_Key | null;
}

export interface UpdateClientVariables {
  id: UUIDString;
  phone?: string | null;
}

export interface UpdateDealData {
  deal_update?: Deal_Key | null;
}

export interface UpdateDealVariables {
  id: UUIDString;
  stage?: string | null;
}

export interface UpdateInteractionData {
  interaction_update?: Interaction_Key | null;
}

export interface UpdateInteractionVariables {
  id: UUIDString;
  summary?: string | null;
}

export interface UpdateTaskData {
  task_update?: Task_Key | null;
}

export interface UpdateTaskVariables {
  id: UUIDString;
  isCompleted?: boolean | null;
}

/** Generated Node Admin SDK operation action function for the 'CreateAccountData' Mutation. Allow users to execute without passing in DataConnect. */
export function createAccountData(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAccountDataData>>;
/** Generated Node Admin SDK operation action function for the 'CreateAccountData' Mutation. Allow users to pass in custom DataConnect instances. */
export function createAccountData(options?: OperationOptions): Promise<ExecuteOperationResponse<CreateAccountDataData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateAccount' Mutation. Allow users to execute without passing in DataConnect. */
export function updateAccount(dc: DataConnect, vars: UpdateAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAccountData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateAccount' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateAccount(vars: UpdateAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateAccountData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteAccount' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteAccount(dc: DataConnect, vars: DeleteAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteAccountData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteAccount' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteAccount(vars: DeleteAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteAccountData>>;

/** Generated Node Admin SDK operation action function for the 'GetAccount' Query. Allow users to execute without passing in DataConnect. */
export function getAccount(dc: DataConnect, vars: GetAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAccountData>>;
/** Generated Node Admin SDK operation action function for the 'GetAccount' Query. Allow users to pass in custom DataConnect instances. */
export function getAccount(vars: GetAccountVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetAccountData>>;

/** Generated Node Admin SDK operation action function for the 'ListAccounts' Query. Allow users to execute without passing in DataConnect. */
export function listAccounts(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAccountsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAccounts' Query. Allow users to pass in custom DataConnect instances. */
export function listAccounts(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAccountsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateClientData' Mutation. Allow users to execute without passing in DataConnect. */
export function createClientData(dc: DataConnect, vars: CreateClientDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateClientDataData>>;
/** Generated Node Admin SDK operation action function for the 'CreateClientData' Mutation. Allow users to pass in custom DataConnect instances. */
export function createClientData(vars: CreateClientDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateClientDataData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateClient' Mutation. Allow users to execute without passing in DataConnect. */
export function updateClient(dc: DataConnect, vars: UpdateClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateClientData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateClient' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateClient(vars: UpdateClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateClientData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteClient' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteClient(dc: DataConnect, vars: DeleteClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteClientData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteClient' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteClient(vars: DeleteClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteClientData>>;

/** Generated Node Admin SDK operation action function for the 'GetClient' Query. Allow users to execute without passing in DataConnect. */
export function getClient(dc: DataConnect, vars: GetClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetClientData>>;
/** Generated Node Admin SDK operation action function for the 'GetClient' Query. Allow users to pass in custom DataConnect instances. */
export function getClient(vars: GetClientVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetClientData>>;

/** Generated Node Admin SDK operation action function for the 'ListClients' Query. Allow users to execute without passing in DataConnect. */
export function listClients(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListClientsData>>;
/** Generated Node Admin SDK operation action function for the 'ListClients' Query. Allow users to pass in custom DataConnect instances. */
export function listClients(options?: OperationOptions): Promise<ExecuteOperationResponse<ListClientsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateDealData' Mutation. Allow users to execute without passing in DataConnect. */
export function createDealData(dc: DataConnect, vars: CreateDealDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateDealDataData>>;
/** Generated Node Admin SDK operation action function for the 'CreateDealData' Mutation. Allow users to pass in custom DataConnect instances. */
export function createDealData(vars: CreateDealDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateDealDataData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateDeal' Mutation. Allow users to execute without passing in DataConnect. */
export function updateDeal(dc: DataConnect, vars: UpdateDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateDealData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateDeal' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateDeal(vars: UpdateDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateDealData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteDeal' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteDeal(dc: DataConnect, vars: DeleteDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteDealData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteDeal' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteDeal(vars: DeleteDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteDealData>>;

/** Generated Node Admin SDK operation action function for the 'GetDeal' Query. Allow users to execute without passing in DataConnect. */
export function getDeal(dc: DataConnect, vars: GetDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealData>>;
/** Generated Node Admin SDK operation action function for the 'GetDeal' Query. Allow users to pass in custom DataConnect instances. */
export function getDeal(vars: GetDealVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetDealData>>;

/** Generated Node Admin SDK operation action function for the 'ListDeals' Query. Allow users to execute without passing in DataConnect. */
export function listDeals(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealsData>>;
/** Generated Node Admin SDK operation action function for the 'ListDeals' Query. Allow users to pass in custom DataConnect instances. */
export function listDeals(options?: OperationOptions): Promise<ExecuteOperationResponse<ListDealsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateInteractionData' Mutation. Allow users to execute without passing in DataConnect. */
export function createInteractionData(dc: DataConnect, vars: CreateInteractionDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateInteractionDataData>>;
/** Generated Node Admin SDK operation action function for the 'CreateInteractionData' Mutation. Allow users to pass in custom DataConnect instances. */
export function createInteractionData(vars: CreateInteractionDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateInteractionDataData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateInteraction' Mutation. Allow users to execute without passing in DataConnect. */
export function updateInteraction(dc: DataConnect, vars: UpdateInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInteractionData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateInteraction' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateInteraction(vars: UpdateInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateInteractionData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteInteraction' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteInteraction(dc: DataConnect, vars: DeleteInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteInteractionData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteInteraction' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteInteraction(vars: DeleteInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteInteractionData>>;

/** Generated Node Admin SDK operation action function for the 'GetInteraction' Query. Allow users to execute without passing in DataConnect. */
export function getInteraction(dc: DataConnect, vars: GetInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInteractionData>>;
/** Generated Node Admin SDK operation action function for the 'GetInteraction' Query. Allow users to pass in custom DataConnect instances. */
export function getInteraction(vars: GetInteractionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetInteractionData>>;

/** Generated Node Admin SDK operation action function for the 'ListInteractions' Query. Allow users to execute without passing in DataConnect. */
export function listInteractions(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListInteractionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListInteractions' Query. Allow users to pass in custom DataConnect instances. */
export function listInteractions(options?: OperationOptions): Promise<ExecuteOperationResponse<ListInteractionsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateTaskData' Mutation. Allow users to execute without passing in DataConnect. */
export function createTaskData(dc: DataConnect, vars: CreateTaskDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateTaskDataData>>;
/** Generated Node Admin SDK operation action function for the 'CreateTaskData' Mutation. Allow users to pass in custom DataConnect instances. */
export function createTaskData(vars: CreateTaskDataVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateTaskDataData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateTask' Mutation. Allow users to execute without passing in DataConnect. */
export function updateTask(dc: DataConnect, vars: UpdateTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTaskData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateTask' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateTask(vars: UpdateTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTaskData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteTask' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteTask(dc: DataConnect, vars: DeleteTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTaskData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteTask' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteTask(vars: DeleteTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTaskData>>;

/** Generated Node Admin SDK operation action function for the 'GetTask' Query. Allow users to execute without passing in DataConnect. */
export function getTask(dc: DataConnect, vars: GetTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetTaskData>>;
/** Generated Node Admin SDK operation action function for the 'GetTask' Query. Allow users to pass in custom DataConnect instances. */
export function getTask(vars: GetTaskVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetTaskData>>;

/** Generated Node Admin SDK operation action function for the 'ListTasks' Query. Allow users to execute without passing in DataConnect. */
export function listTasks(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListTasksData>>;
/** Generated Node Admin SDK operation action function for the 'ListTasks' Query. Allow users to pass in custom DataConnect instances. */
export function listTasks(options?: OperationOptions): Promise<ExecuteOperationResponse<ListTasksData>>;

