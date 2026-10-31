import { buildEstimatePrompt, consumedVolume, parseEstimateText, volumeFromLevel } from "./estimate"

describe("parseEstimateText", () => {
  it("parses plain and fenced JSON", () => {
    expect(
      parseEstimateText('{"bottleVolume": 500, "waterVolume": 250.4, "confidence": 0.9}'),
    ).toEqual({
      bottleVolume: 500,
      waterVolume: 250,
      confidence: 0.9,
    })
    expect(
      parseEstimateText(
        '```json\n{"bottleVolume": 1000, "waterVolume": 0, "confidence": 0.7}\n```',
      ),
    ).toEqual({ bottleVolume: 1000, waterVolume: 0, confidence: 0.7 })
  })

  it("clamps impossible values", () => {
    const r = parseEstimateText('{"bottleVolume": 500, "waterVolume": 900, "confidence": 4}')
    expect(r.waterVolume).toBe(500)
    expect(r.confidence).toBe(1)
    expect(
      parseEstimateText('{"bottleVolume": 99999, "waterVolume": -5, "confidence": 0.5}'),
    ).toEqual({
      bottleVolume: 3000,
      waterVolume: 0,
      confidence: 0.5,
    })
  })

  it("rejects replies without the expected fields", () => {
    expect(() => parseEstimateText("I can't see a bottle")).toThrow()
    expect(() => parseEstimateText('{"bottleVolume": "big"}')).toThrow()
  })
})

describe("volumes", () => {
  it("logs the difference between before and after, never negative", () => {
    expect(consumedVolume(500, 120)).toBe(380)
    expect(consumedVolume(200, 300)).toBe(0)
  })

  it("maps model classes to a fraction of the bottle", () => {
    expect(volumeFromLevel("half", 1000)).toBe(500)
    expect(volumeFromLevel("full", 750)).toBe(750)
    expect(volumeFromLevel("overflowing", 500)).toBe(500)
  })

  it("tells the model about the known bottle size on the after photo", () => {
    expect(buildEstimatePrompt("after", 750)).toContain("750 ml")
    expect(buildEstimatePrompt("before")).not.toContain("same bottle")
  })
})
