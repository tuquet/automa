import { FleetService } from './fleet.service';
export declare class FleetController {
    private readonly fleetService;
    constructor(fleetService: FleetService);
    getAllFleets(): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }[]>;
    getFleetById(id: string): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }>;
    createFleet(body: any): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        name: string;
        description: string | null;
    }>;
    getFleetMembers(id: string): Promise<{
        createdAt: string | null;
        accountId: string;
        fleetId: string;
    }[]>;
    addFleetMember(id: string, body: {
        accountId: string;
    }): Promise<{
        success: boolean;
    }>;
    removeFleetMember(id: string, accountId: string): Promise<{
        success: boolean;
    }>;
}
