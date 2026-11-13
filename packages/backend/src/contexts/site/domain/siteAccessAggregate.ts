export class SiteAccess {
    constructor(private opened: boolean) {}

    static closed(): SiteAccess {
        return new SiteAccess(false);
    }

    isOpen(): boolean {
        return this.opened;
    }

    open(): void {
        this.opened = true;
    }

    close(): void {
        this.opened = false;
    }
}
