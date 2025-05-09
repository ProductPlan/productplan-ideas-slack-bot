import axios from 'axios'

import { productPlanApiToken, productPlanBaseUrl } from '../config'
import { Idea, IdeaResponse } from '../types'

const api = axios.create({
  baseURL: productPlanBaseUrl,
  headers: { Authorization: `Bearer ${productPlanApiToken}` },
})

// Ideas

// Reference: https://productplan.readme.io/reference/post_api-v2-discovery-ideas
export const submitIdea = (idea: Idea): Promise<IdeaResponse> =>
  api
    .post(
      '/v2/discovery/ideas',
      {
        name: idea.name,
        description: idea.description,
        customer: idea.customer,
        source_name: idea.sourceName,
        source_email: idea.sourceEmail,
      },
      {},
    )
    .then((response) => response.data)
