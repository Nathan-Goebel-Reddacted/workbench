import { EntityManager } from '@mikro-orm/postgresql';
import { IThemeRepository } from '../../domain/repository/iThemeRepository';
import { Theme } from '../../domain/themeAggregate';
import { ThemeId } from '../../domain/valueObject/themeId';
import { ThemeName } from '../../domain/valueObject/themeName';
import { ThemeColors } from '../../domain/valueObject/themeColors';
import { ThemeOrmEntity } from '../entity/themeOrmEntity';

export class ThemeRepository implements IThemeRepository {
    constructor(private readonly em: EntityManager) {}

    async findById(id: ThemeId): Promise<Theme | null> {
        const row = await this.em.findOne(ThemeOrmEntity, { id: id.getValue() });
        return row ? this.toDomain(row) : null;
    }

    async findAll(): Promise<Theme[]> {
        const rows = await this.em.findAll(ThemeOrmEntity, { orderBy: { createdAt: 'asc' } });
        return rows.map(row => this.toDomain(row));
    }

    async isEmpty(): Promise<boolean> {
        return (await this.em.count(ThemeOrmEntity)) === 0;
    }

    async save(theme: Theme): Promise<void> {
        await this.em.transactional(async em => {
            await em.upsert(ThemeOrmEntity, this.toOrm(theme), { onConflictFields: ['id'] });
        });
    }

    private toDomain(row: ThemeOrmEntity): Theme {
        return Theme.rehydrate(
            new ThemeId(row.id),
            new ThemeName(row.name),
            new ThemeColors(row.colors),
            row.visible,
            row.isDefault,
            row.createdAt,
        );
    }

    private toOrm(theme: Theme): ThemeOrmEntity {
        const row = new ThemeOrmEntity();
        row.id = theme.getId().getValue();
        row.name = theme.getName().getValue();
        row.colors = { ...theme.getColors().toRecord() };
        row.visible = theme.isVisible();
        row.isDefault = theme.isDefault();
        row.createdAt = theme.getCreatedAt();
        return row;
    }
}
