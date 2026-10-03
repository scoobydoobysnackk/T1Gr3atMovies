export type Section = {
  slug: string;
  label: string;
  kind: "movie" | "tv";
  params: Record<string, string | number>;
  mature?: boolean;
};

export const SECTIONS: Section[] = [
  { slug: "action", label: "Action", kind: "movie", params: { with_genres: 28 } },
  { slug: "comedy", label: "Comedy", kind: "movie", params: { with_genres: 35 } },
  { slug: "drama", label: "Drama", kind: "movie", params: { with_genres: 18 } },
  { slug: "horror", label: "Horror", kind: "movie", params: { with_genres: 27 } },
  { slug: "thriller", label: "Thriller", kind: "movie", params: { with_genres: 53 } },
  { slug: "romance", label: "Romance", kind: "movie", params: { with_genres: 10749 } },
  { slug: "sci-fi", label: "Sci-Fi", kind: "movie", params: { with_genres: 878 } },
  { slug: "adventure", label: "Adventure", kind: "movie", params: { with_genres: 12 } },
  { slug: "animation", label: "Animation", kind: "movie", params: { with_genres: 16 } },
  { slug: "family", label: "Family", kind: "movie", params: { with_genres: 10751 } },
  { slug: "crime", label: "Crime", kind: "movie", params: { with_genres: 80 } },
  { slug: "mystery", label: "Mystery", kind: "movie", params: { with_genres: 9648 } },
  { slug: "fantasy", label: "Fantasy", kind: "movie", params: { with_genres: 14 } },
  { slug: "documentary", label: "Documentary", kind: "movie", params: { with_genres: 99 } },
  { slug: "tv-shows", label: "TV Shows", kind: "tv", params: {} },
  { slug: "crime-tv", label: "Crime Series", kind: "tv", params: { with_genres: 80 } },
  {
    slug: "18-plus",
    label: "18+",
    kind: "movie",
    mature: true,
    params: { certification_country: "US", certification: "R|NC-17", "vote_count.gte": 200 },
  },
];

export const sectionBySlug = (slug: string) => SECTIONS.find((s) => s.slug === slug);
