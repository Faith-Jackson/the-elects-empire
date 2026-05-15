import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export default function SEO({ 
  title = 'The Elects Empire - Centered in Jesus Christ', 
  description = 'A digital sanctuary for spiritual discovery, communal prayer, and deep biblical findings. Ye are a chosen generation, a royal priesthood.', 
  image = '/og-image.png', // Suggesting a default OG image path
  url = 'https://electsempire.com', // Base URL
  type = 'website',
  keywords = 'Bible, Christianity, Elects Empire, Spiritual Growth, Prayer, Fellowship'
}: SEOProps) {
  const siteTitle = title.includes('The Elects Empire') ? title : `${title} | The Elects Empire`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical Link */}
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
