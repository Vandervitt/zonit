import type { ComponentType } from "react";
import type { PageBlock } from "@/types/schema";

import { TrustBannerBlock } from "./blocks/TrustBannerBlock";
import { FeaturesBlock } from "./blocks/FeaturesBlock";
import { ReviewsBlock } from "./blocks/ReviewsBlock";
import { AuthorityBlock } from "./blocks/AuthorityBlock";
import { FAQBlock } from "./blocks/FAQBlock";
import { AssuranceBlock } from "./blocks/AssuranceBlock";
import { LogoWallBlock } from "./blocks/LogoWallBlock";
import { PainPointsBlock } from "./blocks/PainPointsBlock";
import { LeadMagnetBlock } from "./blocks/LeadMagnetBlock";
import { ProofCasesBlock } from "./blocks/ProofCasesBlock";
import { VisualGalleryBlock } from "./blocks/VisualGalleryBlock";
import { MetricsBlock } from "./blocks/MetricsBlock";
import { CountdownBlock } from "./blocks/CountdownBlock";

type BlockProps = { data: unknown; primaryColor: string; id: string; highlight?: boolean };

export const BLOCK_REGISTRY: Record<PageBlock["type"], ComponentType<BlockProps>> = {
  TrustBanner:    TrustBannerBlock  as ComponentType<BlockProps>,
  Features:       FeaturesBlock     as ComponentType<BlockProps>,
  Reviews:        ReviewsBlock      as ComponentType<BlockProps>,
  AuthorityStory: AuthorityBlock    as ComponentType<BlockProps>,
  FAQ:            FAQBlock          as ComponentType<BlockProps>,
  Assurance:      AssuranceBlock    as ComponentType<BlockProps>,
  LogoWall:       LogoWallBlock     as ComponentType<BlockProps>,
  PainPoints:     PainPointsBlock   as ComponentType<BlockProps>,
  LeadMagnet:     LeadMagnetBlock   as ComponentType<BlockProps>,
  ProofCases:     ProofCasesBlock   as ComponentType<BlockProps>,
  VisualGallery:  VisualGalleryBlock as ComponentType<BlockProps>,
  Metrics:        MetricsBlock      as ComponentType<BlockProps>,
  Countdown:      CountdownBlock    as ComponentType<BlockProps>,
};
