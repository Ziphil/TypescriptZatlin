//

import {
  Identifier,
  Zatlin,
  ZatlinError
} from ".";
import {
  Generatable
} from "./generatable";


export class Disjunction extends Generatable {

  private readonly weightedGeneratables: ReadonlyArray<Weighted<Generatable>>;
  private readonly totalWeight: number;

  public constructor(weightedGeneratables: Array<Weighted<Generatable>>) {
    super();
    this.weightedGeneratables = weightedGeneratables;
    this.totalWeight = weightedGeneratables.reduce((totalWeight, [, weight]) => totalWeight + weight, 0);
    if (this.totalWeight <= 0) {
      throw new ZatlinError(1104, `Total weight is zero: '${this}'`);
    }
  }

  public generate(zatlin: Zatlin): string {
    let number = Math.random() * this.totalWeight;
    let currentWeight = 0;
    for (let [generatable, weight] of this.weightedGeneratables) {
      currentWeight += weight;
      if (weight > 0 && number < currentWeight) {
        return generatable.generate(zatlin);
      }
    }
    throw new ZatlinError(9003, "Cannot happen (at Disjunction#generate)");
  }

  public match(string: string, from: number, zatlin: Zatlin): number {
    if (this.weightedGeneratables.length > 0) {
      for (let [generatable, weight] of this.weightedGeneratables) {
        if (weight > 0) {
          let to = generatable.match(string, from, zatlin);
          if (to >= 0) {
            return to;
          }
        }
      }
      return -1;
    } else {
      return -1;
    }
  }

  public isMatchable(zatlin: Zatlin): boolean {
    for (let [generatable] of this.weightedGeneratables) {
      let matchable = generatable.isMatchable(zatlin);
      if (!matchable) {
        return false;
      }
    }
    return true;
  }

  public isValid(zatlin: Zatlin): boolean {
    for (let [generatable] of this.weightedGeneratables) {
      let matchable = generatable.isValid(zatlin);
      if (!matchable) {
        return false;
      }
    }
    return true;
  }

  public findUnknownIdentifier(zatlin: Zatlin): Identifier | undefined {
    for (let [generatable] of this.weightedGeneratables) {
      let identifier = generatable.findUnknownIdentifier(zatlin);
      if (identifier !== undefined) {
        return identifier;
      }
    }
    return undefined;
  }

  public findCircularIdentifier(identifiers: Array<Identifier>, zatlin: Zatlin): Identifier | undefined {
    for (let [generatable] of this.weightedGeneratables) {
      let identifier = generatable.findCircularIdentifier(identifiers, zatlin);
      if (identifier !== undefined) {
        return identifier;
      }
    }
    return undefined;
  }

  public toString(): string {
    let string = "";
    string += `(${this.weightedGeneratables.map(([generatable, weight]) => `${generatable} ${weight}`).join(" | ")})`;
    return string;
  }

}


export type Weighted<T> = readonly [T, number];