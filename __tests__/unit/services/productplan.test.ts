import { submitIdea } from '@services/productplan'

import { idea, productPlanIdeaResponse } from '../__mocks__'

const mockAxiosPost = jest.fn()
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: (...args: any[]) => mockAxiosPost(...args),
  })),
}))

describe('submitIdea', () => {
  beforeAll(() => {
    mockAxiosPost.mockResolvedValue({ data: productPlanIdeaResponse })
  })

  it('should return the idea ID', async () => {
    const response = await submitIdea(idea)

    expect(mockAxiosPost).toHaveBeenCalledWith(
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
    expect(response).toEqual(productPlanIdeaResponse)
  })
})
