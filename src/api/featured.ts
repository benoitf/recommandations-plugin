export interface FeaturedContributeLanguage {
    id: string;
    aliases: string[];
    extensions: string[];
    filenames: string[];

}

export interface FeaturedContributes {
    languages: FeaturedContributeLanguage[];
}

export interface Featured {
    id: string;
    onLanguage: string[];
    workspaceContains: string[];
    contributes: FeaturedContributes;

}