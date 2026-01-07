import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    keywords?: string;
}

const SEO = ({ title, description, keywords }: SEOProps) => {
    return (
        <Helmet>
            <title>{title} | Nexura Sports</title>
            <meta name="description" content={description || "Premium sports apparel and accessories for men, women, and kids."} />
            {keywords && <meta name="keywords" content={keywords} />}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description || "Premium sports apparel and accessories."} />
            <meta property="og:type" content="website" />
        </Helmet>
    );
};

export default SEO;
