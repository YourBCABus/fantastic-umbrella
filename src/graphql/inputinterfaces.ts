export interface AlertInput {
    start: Date;
    end: Date;
    type?: {name: string, color: AlertColorInput};
    title: string;
    content: string;
    dismissable: boolean;
}

interface ColorInput {
    name?: string;
    r: number;
    g: number;
    b: number;
    alpha: number;
}

interface AlertAppearanceColorInput extends ColorInput {
    appearance: string;
}

export interface AlertColorInput extends ColorInput {
    appearances: AlertAppearanceColorInput[];
}

export interface DismissalTimeDataInput {
    startDate: Date;
    endDate: Date;
    dismissalTime?: number;
    alertStartTime?: number;
    alertEndTime?: number;
    daysOfWeek: number[];
}

interface LocationInput {
    lat: number;
    long: number;
}

export interface SchoolInput {
    name?: string,
    location?: { lat: number, long: number },
    available: boolean,
    timeZone?: string,
    publicScopes: string[]
}

export interface MappingDataInput {
    boundingBoxA: { lat: number, long: number };
    boundingBoxB: { lat: number, long: number };
    boardingAreas: BoardingAreaInput[];
}

export interface BoardingAreaInput {
    name: string;
    location: { lat: number, long: number };
}

export interface BusInput {
    otherNames: string[];
    available: boolean;
    name?: string;
    company?: string;
    phone: string[];
}

export interface StopInput {
    name?: string;
    description?: string;
    location?: LocationInput;
    order?: number;
    arrivalTime?: Date;
    invalidateTime?: Date;
    available: boolean;
}

export interface BusStatusInput {
    invalidateTime?: Date;
    boardingArea: string
}