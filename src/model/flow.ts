export interface EventMetadata {
    mode: string;
    command?: string;
    option?: string;
}

export interface Flow {
    id: string;
    name: string;
    description: string;
    flow: string;
    event: EventMetadata | string;
}