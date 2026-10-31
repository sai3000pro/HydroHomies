import { analyzeBottle } from "./analyzeBottle"

jest.mock("./aiEstimate", () => ({
  requestAiEstimate: jest.fn(() => Promise.reject(new Error("offline"))),
}))
jest.mock("@/services/ml/waterLevelClassifier", () => ({
  classifyWaterLevel: jest.fn(() => Promise.resolve(null)),
}))

describe("analyzeBottle fallbacks", () => {
  beforeAll(() => jest.spyOn(console, "warn").mockImplementation(() => {}))

  it("uses AI when it works", async () => {
    const { requestAiEstimate } = jest.requireMock("./aiEstimate")
    requestAiEstimate.mockResolvedValueOnce({
      bottleVolume: 750,
      waterVolume: 600,
      confidence: 0.8,
    })
    expect(await analyzeBottle("file://a.jpg", "before", null)).toMatchObject({
      source: "ai",
      waterVolume: 600,
    })
  })

  it("uses the on-device model for the before photo when AI fails", async () => {
    const { classifyWaterLevel } = jest.requireMock("@/services/ml/waterLevelClassifier")
    classifyWaterLevel.mockResolvedValueOnce({ level: "half", fraction: 0.5, confidence: 0.7 })
    expect(await analyzeBottle("file://a.jpg", "before", null)).toMatchObject({
      source: "on-device",
      bottleVolume: 500,
      waterVolume: 250,
    })
  })

  it("never over-logs: a failed after estimate defaults to the before volume", async () => {
    const r = await analyzeBottle("file://b.jpg", "after", 750, 600)
    expect(r).toMatchObject({ source: "manual", bottleVolume: 750, waterVolume: 600 })
  })
})
